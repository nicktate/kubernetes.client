'use strict';

const KubernetesRequest = require('./kubernetes-request');

class KubernetesResource {
    constructor(options = {}) {
        this._resource = options;

        this._requestOptions = {
            serverConfig: this._resource.serverConfig,
            isNamespaced: this._resource.isNamespaced,
            group: this._resource.preferredGroup,
            version: this._resource.groups[this._resource.preferredGroup].preferredVersion,
            apiResource: this._resource.apiResource
        };
    }

    // convenience request starter functions
    namespace(namespace) {
        return new KubernetesRequest({
            ...this._requestOptions,
            namespace
        });
    }

    allNamespaces() {
        return new KubernetesRequest({
            ...this._requestOptions,
            allNamespaces: true
        });
    }

    list() {
        return new KubernetesRequest({
            ...this._requestOptions
        }).list();
    }

    get(name) {
        return new KubernetesRequest({
            ...this._requestOptions
        }).get(name);
    }

    post(body) {
        return new KubernetesRequest({
            ...this._requestOptions
        }).post(body);
    }

    put(name, body) {
        return new KubernetesRequest({
            ...this._requestOptions
        }).put(name, body);
    }

    patch(name, body) {
        return new KubernetesRequest({
            ...this._requestOptions
        }).patch(name, body);
    }

    delete(name) {
        return new KubernetesRequest({
            ...this._requestOptions
        }).delete(name);
    }
}

module.exports = KubernetesResource;
