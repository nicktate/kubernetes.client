'use strict';

const KubernetesResource = require('./kubernetes-resource');
const KubernetesRequest = require('./kubernetes-request');

const { compareResourceVersions } = require('./util');

const _assignWith = require('lodash/assignWith');
const _filter = require('lodash/filter');
const _forEach = require('lodash/forEach');
const _get = require('lodash/get');
const _head = require('lodash/head');
const _map = require('lodash/map');
const _reduce = require('lodash/reduce');
const _union = require('lodash/union');

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

    async _getResourceMetaForGroup(group) {
        const groupName = group.name;
        const groupVersions = _map(group.versions, v => v.version);

        const resourceMetaByVersion = await Promise.all(_map(groupVersions, version =>
            new Promise(async (resolve, reject) => {
                const path = groupName === 'core' ? `${CORE_API_ROUTE}/${version}` : `${API_GROUPS_ROUTE}/${groupName}/${version}`;

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

                // Ignore sub-resources of the form "${ resource }/scale"
                const resources = _filter(apiResourceList.resources, r => _get(r, 'name', '').indexOf('/') === -1);

                const resourceMetadata = _reduce(
                    resources,
                    (acc, resource) => ({
                        ...acc,
                        [resource.kind]: {
                            isNamespaced: resource.namespaced,
                            kind: resource.kind,
                            apiResource: resource.name,
                            supportsAllNamespaces: resource.verbs.indexOf('list') >= 0,
                            supportedVerbs: resource.verbs,
                            preferredGroup: groupName,
                            groups: {
                                [groupName]: {
                                    versions: [ version ],
                                    preferredVersion: version
                                }
                            },
                            version
                        }
                    }), {});

                resolve(resourceMetadata);
            })
        ));

        return resourceMetaByVersion;
    }

    async _getResourceMetadata(apiGroupList = {}) {
        const allGroupResources = await Promise.all(_map(apiGroupList.groups, group => {
            return new Promise(async (resolve, reject) => {
                let resourceMetaForGroup;

                try {
                    resourceMetaForGroup = await this._getResourceMetaForGroup(group);
                } catch(e) {
                    return reject(e);
                }

                const latestGroupResources = _reduce(
                    resourceMetaForGroup,
                    (a, b) => {
                        return _assignWith({}, a, b, (objValue, srcValue) => {
                            if(objValue && srcValue) {
                                const srcGroup = _get(srcValue, ['groups', group.name ], {});
                                const objGroup = _get(objValue, ['groups', group.name ], {});
                                const versions = _union(srcGroup.versions || [], objGroup.versions || []);

                                const newValue = compareResourceVersions(srcGroup.preferredVersion, objGroup.preferredVersion) === 1
                                    ? srcValue
                                    : objValue;

                                return {
                                    ...newValue,
                                    groups: {
                                        [ group.name ]: {
                                            versions,
                                            preferredVersion: _head(versions.sort((a, b) => compareResourceVersions(b, a)))
                                        }
                                    }
                                };
                            }
                        });
                    }, {}
                );

                return resolve(latestGroupResources);
            });
        }));

        return _reduce(allGroupResources, (acc, resources) => {
            _forEach(resources, resource => {
                const kind = resource.kind;
                const groupName = resource.preferredGroup;
                const group = resource.groups[groupName];

                if(!acc[kind]) {
                    acc[kind] = resource;
                }

                // Merge the groups
                acc[kind]['groups'][groupName] = group;

                const preferredGroupName = acc[kind].preferredGroup;
                if(!preferredGroupName) {
                    // if we don't have a preferredGroup, take the current
                    acc[kind].preferredGroup = groupName;
                } else {
                    const preferredGroup = _get(acc, [kind, 'groups', preferredGroupName], {});

                    const versionComparison = compareResourceVersions(
                        preferredGroup.preferredVersion || '',
                        group.preferredVersion || ''
                    );

                    if((preferredGroupName === 'extensions' && groupName !== 'extensions') ||
                      (groupName !== 'extensions' && versionComparison === -1)) {
                        // if we have a newer preferredVersion not in 'extensions'
                        // prefer that
                        acc[kind].preferredGroup = groupName;
                    }
                }
            });

            return acc;
        }, {});
    }
}

module.exports = ApiResources;
