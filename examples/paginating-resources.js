/* eslint-disable */
'use strict';

const KubernetesClient = require('../index.js').Client;


async function paginateResources() {
  const client = new KubernetesClient({
      config: KubernetesClient.Config.fromKubeConfig(),
  });
  await client.loadSpec()

  // get all pods in all namespaces, but limit resulting list to 1
  const pods = await client.resources.Pod.limit(1).allNamespaces().list()

  // get all pods in all namespaces, limit each request to 1, but paginate until we fetch all resources
  const allPods = await KubernetesClient.paginate(client.resources.Pod.allNamespaces().limit(1))

  // get all pods in all namespaces, apply a label-selector limit each request to 1, but paginate until we fetch all resources
  const labeledPods = await KubernetesClient.paginate(client.resources.Pod.labelSelector('k8s-app=kube-dns').allNamespaces().limit(1))
}

paginateResources()
