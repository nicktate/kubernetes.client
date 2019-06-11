'use strict';

const KubernetesResource = require('./kubernetes-resource');
const KubernetesRequest = require('./kubernetes-request');

const _map = require('lodash/map');
const _reduce = require('lodash/reduce');

const CORE_API_ROUTE = '/api';
const API_GROUPS_ROUTE = '/apis';

const DEFAULT_HEADERS = {
    accept: 'application/json',
    'accept-encoding': 'gzip'
};

class ApiResources {
    constructor(requestOptions) {
        this._requestOptions = requestOptions || {};
    }

    async load() {
        // store the resource metadata
        let resourceMetadata = {};

        // TODO: once api v2 is introduced, we will need to dynamically determine this
        const coreApi = {
            name: 'core',
            versions: [
                {
                    groupVersion: 'core/v1',
                    version: 'v1'
                }
            ],
            preferredVersion: {
                groupVersion: 'core/v1',
                version: 'v1'
            }
        };

        resourceMetadata = await this._getResourceMetadata({ groups:  [ coreApi ] }, resourceMetadata);

        const apiGroupList = await (new KubernetesRequest({
            requestOptions: this._requestOptions,
            headers: DEFAULT_HEADERS,
            path: API_GROUPS_ROUTE
        })).execute();

        if(apiGroupList.kind === 'APIGroupList') {
            // _getResourceMetadata mutates resources when passed in, re-assigning for clarity
            resourceMetadata = await this._getResourceMetadata(apiGroupList, resourceMetadata);
        }

        // convert resourceMetadata to KubernetesResource class
        return _reduce(resourceMetadata, (acc, val, kind) => {
            acc[kind] = new KubernetesResource({
                ...val,
                requestOptions: this._requestOptions
            });

            return acc;
        }, {});
    }


    async _getResourceMetadata(apiGroupList = {}, initialResources = {}) {
        // TODO: async.parallel
        for(const group of apiGroupList.groups) {
            const groupName = group.name;
            const groupVersions = _map(group.versions, v => v.version);
            const preferredVersion = group.preferredVersion.version;

            // API paths take one of the following two formats:
            // -- Core api path: `/api/v1`
            // -- Group api path: `/apis/{group}/{version}`
            let path = groupName === 'core' ? `${CORE_API_ROUTE}/${preferredVersion}` : `${API_GROUPS_ROUTE}/${groupName}/${preferredVersion}`;

            const apiResourceList = await (new KubernetesRequest({
                requestOptions: this._requestOptions,
                headers: DEFAULT_HEADERS,
                path
            })).execute();

            for(const resource of apiResourceList.resources) {
                const kind = resource.kind;

                // Ignore sub-resources of the form "{resource}/scale"
                if(resource.name.indexOf('/') >= 0) {
                    continue;
                }

                if(!initialResources[kind]) {
                    initialResources[kind] = {
                        isNamespaced: resource.namespaced,
                        kind,
                        apiResource: resource.name,
                        supportedVerbs: resource.verbs,
                        groups: {},
                        preferredGroup: groupName
                    };

                    // Resources support fetching across all namespaces if it supports the list verb
                    initialResources[kind].supportsAllNamespaces = resource.verbs.indexOf('list') >= 0;
                }

                // prefer apps over extensions
                if(initialResources[kind].preferredGroup === 'extensions' && groupName === 'apps') {
                    initialResources[kind].preferredGroup = groupName;
                }

                // set the versions and preferredVersion for the group
                initialResources[kind]['groups'][groupName] = {
                    versions: groupVersions,
                    preferredVersion
                };
            }
        }

        return initialResources;
    }
}

module.exports = ApiResources;
