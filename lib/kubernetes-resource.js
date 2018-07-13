'use strict';

const KubernetesRequest = require('./kubernetes-request');
const localUtil = require('./util');

const _forEach = require('lodash/forEach');

class KubernetesResource {
    constructor(options = {}) {
        if(options.kubeConfig) {
            options.requestOptions = localUtil.formatRequestOptions(options.kubeConfig);
        }

        this._requestOptions = {
            requestOptions: options.requestOptions,
            supportsAllNamespaces: options.supportsAllNamespaces,
            supportedVerbs: options.supportedVerbs,
            isNamespaced: options.isNamespaced,
            group: options.preferredGroup,
            version: options.groups[options.preferredGroup].preferredVersion,
            apiResource: options.apiResource
        };

        _forEach(options.supportedVerbs, (verb) => {
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

        if(options.supportsAllNamespaces) {
            this.allNamespaces = () => {
                return new KubernetesRequest({
                    ...this._requestOptions,
                    allNamespaces: true
                });
            };
        }

        if(options.isNamespaced) {
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
