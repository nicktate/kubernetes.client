/* eslint-disable */
'use strict';

const KubernetesClient = require('../index.js').Client;

async function fromKubeConfig() {
    let client;

    // Easily load the default kubeconfig and current-context
    client = new KubernetesClient({
        config: KubernetesClient.Config.fromKubeConfig(),
    });
    await client.loadSpec()

    // Manually specify a kubeconfig path and context
    client = new KubernetesClient({
        config: KubernetesClient.Config.fromKubeConfig({
            kubeConfig: `${HOME}/customconfig`,
            context: 'mycontext',
        }),
    });
    await client.loadSpec()
}

async function manualConfig() {
    let client;

    // manually specify connection configuration
    client = new KubernetesClient({
        config: {
            // url address of the server
            server: 'http://localhost:6443',

            // ignore ssl certs for server
            insecureSkipTlsVerify: true,

            // certificate authority for kubernetes server
            ca: '',

            user: {
                // provide a client cert/key for cert authentication
                clientCert: '',
                clientKey: '',

                // provide a user/pass for basic auth authentication
                username: '',
                password: '',

                // provide a user token for authentication
                token: '',
            },
        },
    });

    await client.loadSpec()
}

async function inClusterConfig() {
    let client;

    // Pull configuration information from mounted SA in cluster
    client = new KubernetesClient({
        config: KubernetesClient.Config.inCluster(),
    });

    await client.loadSpec()
}

async function manualKubernetesVersion() {
    let client;

    // manually specify the cluster kubernetes version and load spec from a local openapi spec file
    // see supported versions at https://github.com/containership/kubernetes.client/tree/master/lib/specs
    client = new KubernetesClient({
        config: KubernetesClient.Config.fromKubeConfig(),
        version: '1.10',
    });

    // no need to laod spec if you manually defined Kubernetes version
    // await client.loadSpec()
}
