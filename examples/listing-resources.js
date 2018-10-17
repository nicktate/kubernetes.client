/* eslint-disable */
'use strict';

const KubernetesClient = require('../index.js').Client;


async function listResources() {
  const client = new KubernetesClient({
      config: KubernetesClient.Config.fromKubeConfig(),
  });
  await client.loadSpec()

  // get all deployments in the `default` namespace
  const deployments = await client.resources.Deployment.list()

  // get deployments in the `kube-system` namespace
  const kubeSystemDeployments = await client.resources.Deployment.namespace('kube-system').list()

  // get deployments in all namespaces
  const allNamespaceDeployments = await client.resources.Deployment.allNamespaces().list()

  // get all pods matching the tag k8s-app: kube-dns in any namespace
  const kubeDnsDeployments = await client.resources.Pod.allNamespaces().labelSelector('k8s-app=kube-dns')
}

async function getResources() {
  const client = new KubernetesClient({
      config: KubernetesClient.Config.fromKubeConfig(),
  });
  await client.loadSpec()

  // Get all daemonsets, and then pick the first one to get individually
  const dsList = await client.resources.DaemonSet.allNamespaces().list()
  const ds = dsList.items.length > 0
    && await client.resources.DaemonSet
    .namespace(dsList.items[0].metadata.namespace)
    .get(dsList.items[0].metadata.name)
}

listResources()
getResources()
