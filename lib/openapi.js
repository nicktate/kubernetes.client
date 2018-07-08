'use strict';

const KubernetesResource = require('./kubernetes-resource');
const localUtil = require('./util');

const _compact = require('lodash/compact');
const _forEach = require('lodash/forEach');
const _get = require('lodash/get');

class OpenApi {
    constructor(spec, serverConfig) {
        this.parseSpec(spec, serverConfig);
    }

    parseSpec(spec, serverConfig) {
        if(Buffer.isBuffer(spec) || typeof spec === 'string') {
            spec = JSON.parse(spec);
        }

        _forEach(spec.paths, (verbs, k) => {
            if(!k.startsWith('/api')) {
                return true;
            }

            let group = 'core';
            let version = 'v1';
            let split = _compact(k.split('/'));

            // grouped route vs core route
            if(k.startsWith('/apis/')) {
                group = split[1];
                version = split[2];
                split = split.slice(3);
            } else {
                split = split.slice(2);
            }

            // ignore api group requests
            if(split.length === 0) {
                // ex: /apis/settings.k8s.io
                return true;
            }

            // ignoring watch apis for now...
            if(split[0] === 'watch') {
                // ex: watch/namespaces/{namespace}/deployments/{name}
                return true;
            }

            const nameIdx = split.indexOf('{name}');
            const named = nameIdx >= 0;

            // ignoring sub-resource routes for now...
            if(named && nameIdx !== split.length - 1) {
                // ex: namespaces/{namespace}/deployments/{name}/scale
                return true;
            }

            const namespaced = split.indexOf('{namespace}') >= 0;
            const apiResource = namespaced ? split[2] : split[0];

            _forEach(verbs, (definition, verb) => {
                // ignore parameter verbs for now...
                if(verb === 'parameters') {
                    return true;
                }

                const kind = _get(definition, 'x-kubernetes-group-version-kind.kind');

                if(!this[kind]) {
                    this[kind] = {
                        isNamespaced: namespaced,
                        kind,
                        apiResource,
                        groups: {},
                        preferredGroup: group
                    };
                }

                this[kind].isNamespaced = this[kind].isNamespaced || namespaced;

                if(!this[kind].groups[group]) {
                    this[kind].groups[group] = {
                        versions: [],
                        preferredVersion: version
                    };
                }

                if(this[kind].groups[group].versions.indexOf(version) < 0) {
                    this[kind].groups[group].versions.push(version);
                }

                // prefer apps over extensions
                if(this[kind].preferredGroup === 'extensions' && group === 'apps') {
                    this[kind].preferredGroup = group;
                }

                // prefer latest-mature version
                if(localUtil.compareResourceVersions(version, this[kind].groups[group].preferredVersion) > 0) {
                    this[kind].groups[group].preferredVersion = version;
                }
            });
        });

        // convert to KubernetesResource class
        _forEach(this, (val, kind) => {
            this[kind] = new KubernetesResource({
                ...val,
                serverConfig
            });
        });

    }
}

module.exports = OpenApi;
