# kubernetes.client

`kubernetes.client` is an opinionated javascript client for Kubernetes clusters.

**Warning**: This project is currently under active development and is subject to breaking changes without notice.

## Installing

Install with yarn:

```
yarn add @containership/kubernetes.client
```

Install with npm:

```
npm install @containership/kubernetes.client --save
```

## Usage

### Setting up the client

You can pull remote cluster information from an existing kubeconfig file:

```
const client = new KubernetesClient({
    config: KubernetesClient.Config.fromKubeConfig({
        kubeConfig: ~/.kube/config,
        context: 'my-context',
    }),
    version: '1.10'
});
```

If you know the version of Kubernetes the cluster is running, you can specify it
when setting up the client. If not, you can always dynamically load the cluster
api spec (this is preferred).

After setting up a initial client config, run the following command:

```
await client.loadSpec()
```

Once you have loaded the cluster specification either dynamically for from specifying
an initial Kubernetes version, you have access to all the resources from the
`client.resources` object.

To list all the `Deployments` on the cluster in the `default`, you would just have to run the following:

```
const deployments = await client.resources.Deployment.list()
```

You can specify a specific namespace and many other configurable parameters through the builder api.

```
const customNamespaceDeployments = await client.resources.Deployment.namespace('custom').list()
```

The client even supports pagination out of the box. You just pass a configured resource call to the paginate
method, and it handles fetching and combining all the resources into a single `list` response!

```
const allDeployments = await KubernetesClient.paginate(client.resources.Deployment.allNamespaces().limit(25))
```

Extensive usage documentation and examples will become available as the project matures

## Contributing

Thank you for your interest in this project and for your interest in contributing!
Feel free to open issues for feature requests, bugs, or even just questions - we love feedback and want to hear from you.

PRs are also always welcome!
However, if the feature you're considering adding is fairly large in scope, please consider opening an issue for discussion first.

## Inspiration

https://github.com/godaddy/kubernetes-client

We loved the way the kubernetes.client automatically generated user friendly APIs from cluster openapi specs. With all this additional
knowledge, we didn't think end users should have to know and understand which api version of resources they need to deal with to communicate
with a cluster. We flipped the concept and provide a power way to interact with clusters without having the need to specify API versions, but
still leave that flexiblity to you if needed.
