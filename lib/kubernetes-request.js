'use strict';

const localUtil = require('./util');

const request = require('request');

const _defaultsDeep = require('lodash/defaultsDeep');
const _get = require('lodash/get');
const _isEmpty = require('lodash/isEmpty');

class KubernetesRequest {
    constructor(options = {}) {
    // base server properties
        this._serverConfig = options.serverConfig;

        // individual request properties
        this._isNamespaced = options.isNamespaced;
        this._namespace = options.namespace;
        this._allNamespaces = options.allNamespaces;
        this._version = options.version;
        this._group = options.group;
        this._apiResource = options.apiResource;

        // override request paramaters
        this._path = options.path;
        this._query = options.query;
        this._headers = options.headers || {};
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

    namespace(namespace) {
        this._namespace = namespace;
        return this;
    }

    allNamespaces(flag) {
        this._allNamespaces = flag === false ? false : true;
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

    list() {
        return this.execute({
            method: 'GET'
        });
    }

    get(name) {
        this.resourceName(name);

        return this.execute({
            method: 'GET'
        });
    }

    post(body) {
        return this.execute({
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            json: body
        });
    }

    put(name, body) {
        this.resourceName(name);

        return this.execute({
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    }

    patch(name, body) {
        this.resourceName(name);

        return this.execute({
            method: 'PATCH',
            headers: {
                'content-type': 'application/strategic-merge-patch+json'
            },
            body: JSON.stringify(body)
        });
    }

    delete(name) {
        this.resourceName(name);

        return this.execute({
            method: 'DELETE'
        });
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
                    body = JSON.parse(body);
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

        const group = this._group;
        const version = this._version;
        const isCoreGroup = group === 'core';

        let url = isCoreGroup ? '/api' : '/apis';
        url += isCoreGroup ? `/${version}` : `/${group}/${version}`;

        if(this._isNamespaced && this._allNamespaces !== true) {
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

        return query.substring(1);
    }

    _buildRequestOptions(defaults = {}) {
        const serverConfig = this._serverConfig;
        const authOptions = localUtil.formatAuthOptions(serverConfig);

        let url = this._buildRequestPath();
        const query = this._buildRequestQuery();

        if(!_isEmpty(query)) {
            url += `?${query}`;
        }

        const opts = _defaultsDeep({
            ...defaults,
            baseUrl: serverConfig.server,
            url,
            agent: defaults.agent
        }, { headers: this._headers }, authOptions);

        return opts;
    }
}

module.exports = KubernetesRequest;
