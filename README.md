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

Extensive usage documentation will become available as the project matures

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
