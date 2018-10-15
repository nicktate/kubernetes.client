'use strict';

const localUtil = require('../lib/util');

const test = require('ava').test;

test('Selector parsing: equality-based', async t => {
    let selectors = {
        environment: 'production'
    };

    let args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment = production']);

    selectors.host = 'hostA';
    args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment = production', 'host = hostA']);
});

test('Selector parsing: set-based -- matchLabels', async t => {
    let selectors = {
        matchLabels: {
            environment: 'production'
        }
    };

    let args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment = production']);

    selectors.matchLabels.host = 'hostA';
    args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment = production', 'host = hostA']);
});

test('Selector parsing: set-based -- exists', async t => {
    let selectors = {
        matchExpressions: [
            { key: 'environment', operator: 'Exists' }
        ]
    };

    let args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment']);
});

test('Selector parsing: set-based -- doesnotexist', async t => {
    let selectors = {
        matchExpressions: [
            { key: 'environment', operator: 'DoesNotExist' }
        ]
    };

    let args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['!environment']);
});

test('Selector parsing: set-based -- in', async t => {
    let selectors = {
        matchExpressions: [
            { key: 'environment', operator: 'In', values: ['development', 'stage'] }
        ]
    };

    let args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment in (development,stage)']);
});

test('Selector parsing: set-based -- notin', async t => {
    let selectors = {
        matchExpressions: [
            { key: 'environment', operator: 'NotIn', values: ['development', 'stage'] }
        ]
    };

    let args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment notin (development,stage)']);
});

test('Selector parsing: set-based -- combination', async t => {
    let selectors = {
        matchExpressions: [
            { key: 'environment', operator: 'NotIn', values: ['development', 'stage'] },
            { key: 'high-cpu', operator: 'Exists' }
        ]
    };

    let args = localUtil.parseSelectorStatements(selectors);
    t.deepEqual(args, ['environment notin (development,stage)', 'high-cpu']);
});
