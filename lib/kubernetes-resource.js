'use strict';

const KubernetesRequest = require('./kubernetes-request');

const _forEach = require('lodash/forEach');

class KubernetesResource {
    constructor(options = {}) {
        this._resource = options;

        this._requestOptions = {
            serverConfig: this._resource.serverConfig,
            supportsAllNamespaces: this._resource.supportsAllNamespaces,
            supportedVerbs: this._resource.supportedVerbs,
            isNamespaced: this._resource.isNamespaced,
            group: this._resource.preferredGroup,
            version: this._resource.groups[this._resource.preferredGroup].preferredVersion,
            apiResource: this._resource.apiResource
        };

        _forEach(this._resource.supportedVerbs, (verb) => {
            switch (verb) {
            case 'list':
                this.list = () => {
                    return new KubernetesRequest({
                        ...this._requestOptions
                    }).list();
                };
                break;
            case 'get':
                this.get = (name) => {
                    return new KubernetesRequest({
                        ...this._requestOptions
                    }).get(name);
                };
                break;
            case 'post':
                this.post = (body) => {
                    return new KubernetesRequest({
                        ...this._requestOptions
                    }).post(body);
                };
                break;
            case 'put':
                this.put = (name, body) => {
                    return new KubernetesRequest({
                        ...this._requestOptions
                    }).put(name, body);
                };
                break;
            case 'patch':
                this.patch = (name, body) => {
                    return new KubernetesRequest({
                        ...this._requestOptions
                    }).patch(name, body);
                };
                break;
            case 'delete':
                this.delete = (name) => {
                    return new KubernetesRequest({
                        ...this._requestOptions
                    }).delete(name);
                };
                break;
            case 'deletecollection':
                this.deleteCollection = () => {
                    return new KubernetesRequest({
                        ...this._requestOptions
                    }).deleteCollection();
                };
                break;
            default:
                // eslint-disable-next-line no-console
                console.warn(`Unknown verb: ${verb}`);
                break;
            }
        });

        if(this._resource.supportsAllNamespaces) {
            this.allNamespaces = () => {
                return new KubernetesRequest({
                    ...this._requestOptions,
                    allNamespaces: true
                });
            };
        }

        if(this._resource.isNamespaced) {
            this.namespace = (namespace) => {
                return new KubernetesRequest({
                    ...this._requestOptions,
                    namespace
                });
            };
        }
    }

}

module.exports = KubernetesResource;
