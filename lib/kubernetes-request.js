'use strict';

const localUtil = require('./util');

const request = require('request');

const _defaultsDeep = require('lodash/defaultsDeep');
const _forEach = require('lodash/forEach');
const _get = require('lodash/get');
const _isEmpty = require('lodash/isEmpty');

const ALL_VERBS = [
    'list',
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'deletecollection'
];

class KubernetesRequest {
    constructor(options = {}) {
        // base request options
        if(!options.requestOptions && options.kubeConfig) {
            options.requestOptions = localUtil.formatRequestOptions(options.kubeConfig);
        }

        this._defaultRequestOptions = options.requestOptions;

        // individual request properties
        this._supportedVerbs = options.supportedVerbs || ALL_VERBS;
        this._isNamespaced = options.isNamespaced;
        this._supportsAllNamespaces = options.supportsAllNamespaces;
        this._namespace = options.namespace;
        this._allNamespaces = options.allNamespaces;
        this._group = options.preferredGroup;
        this._version = options.preferredVersion || _get(options, `groups["${this._group}"].preferredVersion`);
        this._apiResource = options.apiResource;

        // override request paramaters
        this._path = options.path;
        this._query = options.query;
        this._headers = options.headers || {};
        this._labelSelectors = options.labelSelectors || [];

        if(this._isNamespaced || this._isNamespaced === undefined) {
            this.namespace = (namespace) => {
                this._namespace = namespace;
                return this;
            };
        }

        if(this._supportsAllNamespaces || this._supportsAllNamespaces === undefined) {
            this.allNamespaces = (flag) => {
                this._allNamespaces = flag === false ? false : true;
                return this;
            };
        }

        _forEach(this._supportedVerbs, (verb) => {
            switch (verb) {
            case 'list':
                this.list = () => {
                    return this.execute({
                        method: 'GET'
                    });
                };
                break;
            case 'get':
                this.get = (name) => {
                    this.resourceName(name);

                    return this.execute({
                        method: 'GET'
                    });
                };
                break;
            case 'post':
                this.post = (body) => {
                    return this.execute({
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        json: body
                    });
                };
                break;
            case 'put':
                this.put = (name, body) => {
                    this.resourceName(name);

                    return this.execute({
                        method: 'PUT',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    });
                };
                break;
            case 'patch':
                this.patch = (name, body) => {
                    this.resourceName(name);

                    return this.execute({
                        method: 'PATCH',
                        headers: {
                            'content-type': 'application/strategic-merge-patch+json'
                        },
                        body: JSON.stringify(body)
                    });
                };
                break;
            case 'delete':
                this.delete = (name) => {
                    this.resourceName(name);

                    return this.execute({
                        method: 'DELETE'
                    });
                };
                break;
            case 'deletecollection':
                this.deleteCollection = () => {
                    return this.execute({
                        method: 'DELETE'
                    });
                };
                break;
            default:
                // eslint-disable-next-line no-console
                console.warn(`Unknown verb: ${verb}`);
                break;
            }
        });

    }

    path(path) {
        this._path = path;
        return this;
    }

    query(query) {
        this._query = query;
        return this;
    }

    headers(headers) {
        this._headers = headers;
        return this;
    }

    apiVersion(apiVersion) {
        const split = apiVersion.split('/');

        if(split.length === 2) {
            this.group(split[0]);
            this._version = split[1];
        } else {
            this._version = split[0];
        }

        return this;
    }

    version(version) {
        return this.apiVersion(version);
    }

    group(group) {
        this._group = group;
        return this;
    }

    apiResource(apiResource) {
        this._apiResource = apiResource;
        return this;
    }

    resourceName(name) {
        this._resourceName = name;
        return this;
    }

    continue(id) {
        this._continue = id;
        return this;
    }

    limit(limit) {
        this._limit = limit;
        return this;
    }

    labelSelector(selector) {
        if(typeof selector === 'object') {
            this._labelSelectors.push(...localUtil.parseSelectorStatements(selector));
        } else {
            this._labelSelectors.push(selector);
        }

        return this;
    }

    execute(defaults) {
        const opts = {
            ...this._buildRequestOptions(defaults)
        };

        // let request handle unzipping response
        if(_get(opts, 'headers.accept-encoding') === 'gzip') {
            opts.gzip = true;
        }

        return new Promise((resolve, reject) => {
            return request(opts, (err, res, body) => {
                if(err) {
                    return reject(err);
                }

                // todo: other error cases

                if(_get(res, 'headers.content-type') === 'application/json' && typeof body === 'string') {
                    try {
                        body = JSON.parse(body);
                    } catch(e) {
                        return reject(e);
                    }
                }

                if(body.kind === 'Status' && body.status === 'Failure') {
                    return reject(body);
                }

                return resolve(body);
            });
        });
    }

    _buildRequestPath() {
        if(!_isEmpty(this._path)) {
            return this._path;
        }

        const group = this._group || 'core';
        const version = this._version;
        const isCoreGroup = group === 'core';

        let url = isCoreGroup ? '/api' : '/apis';
        url += isCoreGroup ? `/${version}` : `/${group}/${version}`;

        if(this._isNamespaced && this._allNamespaces !== true || (this._isNamespaced === undefined && this._namespace)) {
            const namespace = this._namespace || 'default';

            url += `/namespaces/${namespace}`;
        }

        url += `/${this._apiResource}`;

        const resourceName = this._resourceName;

        if(resourceName) {
            url += `/${resourceName}`;
        }

        return url;
    }

    _buildRequestQuery() {
        if(!_isEmpty(this._query)) {
            return this._query;
        }

        let query = '';

        // todo: label and other query params
        if(this._limit) {
            query += `&limit=${this._limit}`;
        }

        if(this._continue) {
            query += `&continue=${this._continue}`;
        }

        if(this._labelSelectors.length > 0) {
            const selectors = this._labelSelectors.map(e => encodeURIComponent(e));
            query += `&labelSelector=${ selectors.join(',') }`;
        }

        return query.substring(1);
    }

    _buildRequestOptions(options = {}) {
        let url = this._buildRequestPath();
        const query = this._buildRequestQuery();

        if(!_isEmpty(query)) {
            url += `?${query}`;
        }

        const opts = _defaultsDeep({
            ...options,
            url,
            agent: options.agent
        }, { headers: this._headers }, this._defaultRequestOptions);

        return opts;
    }
}

module.exports = KubernetesRequest;
