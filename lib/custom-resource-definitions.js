'use strict';

const _forEach = require('lodash/forEach');
const _get = require('lodash/get');
const _has = require('lodash/has');
const _map = require('lodash/map');

const getCustomResources = async (client) => {
    // cannot fetch custom resource definitions if the resource is not available
    if(!_has(client, 'resources.CustomResourceDefinition')) {
        return {};
    }

    const customResources = {};
    const crdList = await client.resources.CustomResourceDefinition.list();

    _forEach(crdList.items, crd => {
        const group = _get(crd, 'spec.group');
        const version = _get(crd, 'spec.version');
        const kind = _get(crd, 'spec.names.kind');
        const isNamespaced = _get(crd, 'spec.scope') === 'Namespaced';
        const apiResource = _get(crd, 'spec.names.plural');

        if(!customResources[kind]) {
            customResources[kind] = {
                isNamespaced,
                supportsAllNamespaces: isNamespaced,
                kind,
                apiResource,
                groups: {},
                preferredGroup: group,
                supportedVerbs: ['list', 'get', 'delete', 'deletecollection', 'put', 'patch']
            };
        }

        if(!customResources[kind].groups[group]) {
            customResources[kind].groups[group] = {
                preferredVersion: version,
                versions: _map(_get(crd, 'spec.versions'), 'name')
            };
        }
    });

    return customResources;
};

module.exports.getCustomResources = getCustomResources;
