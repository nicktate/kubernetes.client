'use strict';

const KubernetesResource = require('./kubernetes-resource');
const KubernetesRequest = require('./kubernetes-request');

const _forEach = require('lodash/forEach');
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

        let coreMetadata = await this._getResourceMetadata({ groups:  [ coreApi ] });
        let groupMetadata = {};

        const apiGroupList = await (new KubernetesRequest({
            requestOptions: this._requestOptions,
            headers: DEFAULT_HEADERS,
            path: API_GROUPS_ROUTE
        })).execute();

        if(apiGroupList.kind === 'APIGroupList') {
            groupMetadata = await this._getResourceMetadata(apiGroupList);
        }

        // convert resourceMetadata to KubernetesResource class
        return _reduce({ ...groupMetadata, ...coreMetadata }, (acc, val, kind) => {
            acc[kind] = new KubernetesResource({
                ...val,
                requestOptions: this._requestOptions
            });

            return acc;
        }, {});
    }


    async _getResourceMetadata(apiGroupList = {}) {
        const allGroupResources = await Promise.all(_map(apiGroupList.groups, group => {
            return new Promise(async (resolve, reject) => {
                const groupName = group.name;
                const groupVersions = _map(group.versions, v => v.version);
                const preferredVersion = group.preferredVersion.version;

                // API paths take one of the following two formats:
                // -- Core api path: `/api/v1`
                // -- Group api path: `/apis/{group}/{version}`
                let path = groupName === 'core' ? `${CORE_API_ROUTE}/${preferredVersion}` : `${API_GROUPS_ROUTE}/${groupName}/${preferredVersion}`;
                let apiResourceList;

                try {
                    apiResourceList = await (new KubernetesRequest({
                        requestOptions: this._requestOptions,
                        headers: DEFAULT_HEADERS,
                        path
                    })).execute();
                } catch(e) {
                    return reject(e);
                }

                const resourceMetadata = {};

                for(const resource of apiResourceList.resources) {
                    const kind = resource.kind;

                    // Ignore sub-resources of the form "{resource}/scale"
                    if(resource.name.indexOf('/') >= 0) {
                        continue;
                    }

                    resourceMetadata[kind] = {
                        isNamespaced: resource.namespaced,
                        kind,
                        apiResource: resource.name,
                        supportedVerbs: resource.verbs,
                        groups: {},
                        preferredGroup: groupName
                    };

                    // Resources support fetching across all namespaces if it supports the list verb
                    resourceMetadata[kind].supportsAllNamespaces = resource.verbs.indexOf('list') >= 0;

                    // set the versions and preferredVersion for the group
                    resourceMetadata[kind]['groups'][groupName] = {
                        versions: groupVersions,
                        preferredVersion
                    };
                }

                return resolve(resourceMetadata);
            });
        }));

        return _reduce(allGroupResources, (acc, resources) => {
            _forEach(resources, resource => {
                const kind = resource.kind;
                const group = resource.preferredGroup;

                if(!acc[kind]) {
                    acc[kind] = resource;
                }

                // Merge the groups
                acc[kind]['groups'][group] = resource.groups[group];

                // prefer apps over extensions
                if(acc[kind].preferredGroup === 'extensions' && group === 'apps') {
                    acc[kind].preferredGroup = group;
                }
            });

            return acc;
        }, {});
    }
}

module.exports = ApiResources;
