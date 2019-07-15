'use strict';

const ApiResources = require('./api-resources');
const KubernetesRequest = require('./kubernetes-request');
const localUtil = require('./util');
const OpenApi = require('./openapi');

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const yaml = require('js-yaml');
const zlib = require('zlib');

const _defaultsDeep = require('lodash/defaultsDeep');
const _find = require('lodash/find');
const _get = require('lodash/get');
const _has = require('lodash/has');
const _map = require('lodash/map');

class Client {
    constructor(options = {}) {
        this._options = {
            kubeConfig: options.config,
            requestOptions: options.requestOptions
        };

        if(!this._options.requestOptions && this._options.kubeConfig) {
            this._options.requestOptions = localUtil.formatRequestOptions(this._options.kubeConfig);
        }

        if(this._options.version) {
            const specs = fs.readdirSync(path.resolve(__dirname, './specs'));

            // simple dynamic version parser from spec filename
            // takes the format openapi-${version}.json.gz
            const validVersions = _map(specs, s => {
                return _get(s.match(/\d+\.\d+/), '[0]', 'invalid');
            });

            // coerce versions into a standardized format
            options.version = semver.coerce(options.version);

            // if version, format into major.minor format
            if(options.version) {
                options.version = `${semver.major(options.version)}.${semver.minor(options.version)}`;

                if(validVersions.indexOf(options.version) < 0) {
                    throw new Error(`Kubernetes version ${options.version} not supported for local spec. You can attempt to '.loadSpec' remotely from your cluster`);
                }

                this._options.version = options.version;

                const specPath = path.resolve(__dirname, `./specs/openapi-${options.version}.json.gz`);
                this.resources = new OpenApi(zlib.gunzipSync(fs.readFileSync(specPath)), this._options.requestOptions);
            }
        }
    }

    async loadSpec() {
        const apiResources = new ApiResources(this._options.requestOptions);
        this.resources = await apiResources.load();
    }

    request(options = {}) {
        return new KubernetesRequest(_defaultsDeep(options, {
            requestOptions: this._options.requestOptions
        }));
    }
}

Client.paginate = async (resource) => {
    let listResponse = await resource.list();

    if(!localUtil.isKubernetesListResponse(listResponse)) {
        throw new Error(listResponse);
    }

    let items = [];
    items.push(...listResponse.items);

    while (_has(listResponse.metadata.continue)) {
        listResponse = await resource.continue(listResponse.metadata.continue).list();

        if(!localUtil.isKubernetesListResponse(listResponse)) {
            throw new Error(listResponse);
        }

        items.push(...listResponse.items);
    }

    listResponse.items = items;
    return listResponse;
};

Client.Config = {
    inCluster: () => {
        const host = process.env.KUBERNETES_SERVICE_HOST;
        const port = process.env.KUBERNETES_SERVICE_PORT;
        const caPath = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';
        const tokenPath = '/var/run/secrets/kubernetes.io/serviceaccount/token';
        const ca = fs.readFileSync(caPath, 'utf8');
        const bearer = fs.readFileSync(tokenPath, 'utf8');

        return {
            server: `https://${host}:${port}`,
            ca,
            user: {
                token: bearer
            }
        };
    },

    fromKubeConfig: (options = {}) => {
        let kubePath = localUtil.expandHome(options.kubeConfig || '~/.kube/config');

        if(!path.isAbsolute(kubePath)) {
            kubePath = `${__dirname}/${kubePath}`;
        }

        kubePath = path.resolve(kubePath);

        const kubeConfig = yaml.safeLoad(fs.readFileSync(kubePath, 'utf8'));
        const contextName = options.context || kubeConfig['current-context'];

        const context = _find(kubeConfig.contexts, { name: contextName }).context;
        const cluster = _find(kubeConfig.clusters, { name: context.cluster }).cluster;
        const user = _find(kubeConfig.users, { name: context.user }).user;

        const config = {
            server: cluster.server,
            insecureSkipTlsVerify: cluster['insecure-skip-tls-verify'] ? true : false
        };

        if(cluster['certificate-authority-data']) {
            config.ca = Buffer.from(cluster['certificate-authority-data'], 'base64').toString('utf8');
        }

        if(user['client-certificate'] && user['client-key']) {
            config.user = {
                clientCert: Buffer.from(user['client-certificate'], 'base64').toString('utf8'),
                clientKey: Buffer.from(user['client-key'], 'base64').toString('utf8')
            };
        } else if(user.username && user.password) {
            config.user = {
                username: user.username,
                password: user.password
            };
        } else if(user.token) {
            config.user = {
                token: user.token
            };
        }

        return config;
    }
};

module.exports.Client = Client;
