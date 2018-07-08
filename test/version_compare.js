'use strict';

const localUtil = require('../lib/util');

const test = require('ava').test;

test('Verify version comparison', async t => {
    t.is(localUtil.compareResourceVersions('v2', 'v1'), 1);
    t.is(localUtil.compareResourceVersions('v2', 'v2'), 0);
    t.is(localUtil.compareResourceVersions('v2', 'v3'), -1);

    t.is(localUtil.compareResourceVersions('v2', 'v1alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2', 'v1beta1'), 1);

    t.is(localUtil.compareResourceVersions('v2', 'v2alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2', 'v2beta1'), 1);

    t.is(localUtil.compareResourceVersions('v2', 'v3alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2', 'v3beta1'), -1);

    t.is(localUtil.compareResourceVersions('v2alpha2', 'v1'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v1alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v1alpha2'), 1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v1alpha3'), 1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v1beta1'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v1beta2'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v1beta3'), -1);

    t.is(localUtil.compareResourceVersions('v2alpha2', 'v2'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v2alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v2alpha2'), 0);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v2alpha3'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v2beta1'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v2beta2'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v2beta3'), -1);

    t.is(localUtil.compareResourceVersions('v2alpha2', 'v3'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v3alpha1'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v3alpha2'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v3alpha3'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v3beta1'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v3beta2'), -1);
    t.is(localUtil.compareResourceVersions('v2alpha2', 'v3beta3'), -1);

    t.is(localUtil.compareResourceVersions('v2beta2', 'v1'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v1alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v1alpha2'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v1alpha3'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v1beta1'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v1beta2'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v1beta3'), 1);

    t.is(localUtil.compareResourceVersions('v2beta2', 'v2'), -1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v2alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v2alpha2'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v2alpha3'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v2beta1'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v2beta2'), 0);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v2beta3'), -1);

    t.is(localUtil.compareResourceVersions('v2beta2', 'v3'), -1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v3alpha1'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v3alpha2'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v3alpha3'), 1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v3beta1'), -1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v3beta2'), -1);
    t.is(localUtil.compareResourceVersions('v2beta2', 'v3beta3'), -1);
});
