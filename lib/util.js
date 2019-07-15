'use strict';

const fs = require('fs');

const _forEach = require('lodash/forEach');
const _get = require('lodash/get');
const _isEmpty = require('lodash/isEmpty');

function isKubernetesListResponse(response) {
    const kind = _get(response, 'kind', '');

    return kind.endsWith('List');
}

module.exports.isKubernetesListResponse = isKubernetesListResponse;

function expandHome(path) {
    path = path.replace('~', process.env.HOME);
    path = path.replace('$HOME', process.env.HOME);

    return path;
}

module.exports.expandHome = expandHome;

/**
 * Resources are in the format of `v1`,
 * `v1alpha1`, or `v1beta1`
 */
function compareResourceVersions(a, b) {
    if(a === b) {
        return 0;
    }

    const aMajor = parseInt(a.slice(1, 2));
    const bMajor = parseInt(b.slice(1, 2));
    const aAlpha = a.indexOf('alpha') >= 0;
    const bAlpha = b.indexOf('alpha') >= 0;

    // we always consider alpha versions less
    // beacuse they are not turned on in clusters
    // by default
    if(aAlpha && !bAlpha) {
        return -1;
    }

    if(!aAlpha && bAlpha) {
        return 1;
    }

    // aMajor is greater than bMajor
    if(aMajor > bMajor) {
        return 1;
    }

    // aMajor is less than bMajor
    if(aMajor < bMajor) {
        return -1;
    }

    // major is the same going forward...
    const aBeta = a.indexOf('beta') >= 0;
    const bBeta = b.indexOf('beta') >= 0;
    const aMain = !aAlpha && !aBeta;
    const bMain = !bAlpha && !bBeta;

    // if A is main version and B is alpha or beta
    if(aMain && !bMain) {
        return 1;
    }

    // if A is alpha or beta and B is main version
    if(!aMain && bMain) {
        return -1;
    }

    // if A is alpha and B is beta
    if(aAlpha && bBeta) {
        return -1;
    }

    // Both A&B are alpha versions
    if(aAlpha && bAlpha) {
        let aMinor = a.slice(a.indexOf('alpha') + 'alpha'.length);
        let bMinor = b.slice(b.indexOf('alpha') + 'alpha'.length);

        aMinor = parseInt(aMinor);
        bMinor = parseInt(bMinor);

        if(aMinor === bMinor) {
            return 0;
        }

        return aMinor > bMinor ? 1 : -1;
    }

    // A is beta and B is alpha
    if(aBeta && bAlpha) {
        return 1;
    }

    // Both A&B are beta versions
    if(aBeta && bBeta) {
        let aMinor = a.slice(a.indexOf('beta') + 'beta'.length);
        let bMinor = b.slice(b.indexOf('beta') + 'beta'.length);

        aMinor = parseInt(aMinor);
        bMinor = parseInt(bMinor);

        if(aMinor === bMinor) {
            return 0;
        }

        return aMinor > bMinor ? 1 : -1;
    }

    return 0;
}

module.exports.compareResourceVersions = compareResourceVersions;

function formatRequestOptions(options = {}) {
    const requestOptions = {
        baseUrl: options.server,
        agentOptions: {}
    };

    if(options.user) {
        const userOpts = options.user;

        if(userOpts.username && userOpts.password) {
            requestOptions.auth = {
                username: userOpts.username,
                password: userOpts.password
            };
        }

        if(userOpts.clientCertPath) {
            userOpts.clientCert = fs.readFileSync(userOpts.clientCertPath);
        }

        if(userOpts.clientKeyPath) {
            userOpts.clientKey = fs.readFileSync(userOpts.clientKeyPath);
        }

        if(userOpts.clientCert && userOpts.clientKey) {
            requestOptions.agentOptions = {
                cert: userOpts.clientCert,
                key: userOpts.clientKey
            };
        }

        if(userOpts.token) {
            requestOptions.auth = {
                bearer: userOpts.token
            };
        }
    }

    if(options.caPath) {
        options.ca = fs.readFileSync(options.caPath);
    }

    if(options.ca) {
        requestOptions.agentOptions.ca = options.ca;
    }

    if(options.insecureSkipTlsVerify) {
        requestOptions.agentOptions.rejectUnauthorized = false;
    }

    if(_isEmpty(requestOptions.agentOptions)) {
        requestOptions.agentOptions = null;
    }

    return requestOptions;
}

module.exports.formatRequestOptions = formatRequestOptions;

function parseSelectorStatements(selector) {
    const args = [];

    // assume legacy based selector resource, only supporting equality
    if(!selector.matchLabels && !selector.matchExpressions) {
        _forEach(selector, (val, key) => {
            args.push(`${key} = ${val}`);
        });
    }

    if(selector.matchLabels) {
        _forEach(selector.matchLabels, (val, key) => {
            args.push(`${key} = ${val}`);
        });
    }

    if(selector.matchExpressions) {
        _forEach(selector.matchExpressions, (expression) => {
            switch (expression.operator) {
            case 'In':
            case 'NotIn':
                args.push(`${expression.key} ${expression.operator.toLowerCase()} (${expression.values.join(',')})`);
                break;
            case 'Exists':
                args.push(expression.key);
                break;
            case 'DoesNotExist':
                args.push(`!${expression.key}`);
                break;
            default:
                // eslint-disable-next-line no-console
                console.warn(`Unknown expression operator: ${expression.operator}`);
                break;
            }
        });
    }

    return args;
}

module.exports.parseSelectorStatements = parseSelectorStatements;
