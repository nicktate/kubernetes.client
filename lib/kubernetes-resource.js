'use strict';

const KubernetesRequest = require('./kubernetes-request');
const localUtil = require('./util');

const _forEach = require('lodash/forEach');
const _get = require('lodash/get');

class KubernetesResource {
    constructor(options = {}) {
        if(options.kubeConfig) {
            options.requestOptions = localUtil.formatRequestOptions(options.kubeConfig);
        }

        this._metadata = {
            apiResource: options.apiResource,
            groups: options.groups,
            isNamespaced: options.isNamespaced,
            preferredGroup: options.preferredGroup,
            supportsAllNamespaces: options.supportsAllNamespaces,
            supportedVerbs: options.supportedVerbs
        };

        this._metadata.preferredVersion = _get(options, `groups["${this._metadata.preferredGroup}"].preferredVersion`);
        this._requestOptions = options.requestOptions;

        _forEach(options.supportedVerbs, (verb) => {
            switch (verb) {
            case 'list':
                this.list = () => {
                    return new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        ...this._metadata
                    }).list();
                };
                break;
            case 'get':
                this.get = (name) => {
                    return new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        ...this._metadata
                    }).get(name);
                };
                break;
            case 'post':
                this.post = (body) => {
                    return new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        ...this._metadata
                    }).post(body);
                };
                break;
            case 'put':
                this.put = (name, body) => {
                    return new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        ...this._metadata
                    }).put(name, body);
                };
                break;
            case 'patch':
                this.patch = (name, body) => {
                    return new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        ...this._metadata
                    }).patch(name, body);
                };
                break;
            case 'delete':
                this.delete = (name) => {
                    return new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        ...this._metadata
                    }).delete(name);
                };
                break;
            case 'deletecollection':
                this.deleteCollection = () => {
                    return new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        ...this._metadata
                    }).deleteCollection();
                };
                break;
            default:
                // eslint-disable-next-line no-console
                console.warn(`Unknown verb: ${verb}`);
                break;
            }
        });

        if(options.supportsAllNamespaces) {
            this.allNamespaces = () => {
                return new KubernetesRequest({
                    requestOptions: this._requestOptions,
                    ...this._metadata
                }).allNamespaces();
            };
        }

        if(options.isNamespaced) {
            this.namespace = (namespace) => {
                return new KubernetesRequest({
                    requestOptions: this._requestOptions,
                    ...this._metadata
                }).namespace(namespace);
            };
        }

        this.limit = (limit) => {
            return new KubernetesRequest({
                requestOptions: this._requestOptions,
                ...this._metadata
            }).limit(limit);
        };

        this.labelSelector = (selectors) => {
            return new KubernetesRequest({
                requestOptions: this._requestOptions,
                ...this._metadata
            }).labelSelector(selectors);
        };
    }

    addGroup(groupName, groupDetails) {
        if(!this._metadata.groups[groupName]) {
            this._metadata.groups[groupName] = groupDetails;
        }
    }
}

module.exports = KubernetesResource;
