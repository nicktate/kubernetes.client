# Cluster Management - Containership Changelog

## Versions

- [v0.3.0](#v030)
  - [Features](#features-for-v030)
- [v0.2.1](#v021)
  - [Features](#features-for-v021)
- [v0.2.0](#v020)
  - [Features](#features-for-v020)
  - [Bug Fixes](#bug-fixes-for-v020)
- [v0.1.2](#v012)
  - [Features](#features-for-v012)
- [v0.1.1](#v011)
  - [Features](#features-for-v011)

## v0.3.0

### Features for v0.3.0

* Add ability to specify `.labelSelectors` on individual Kubernetes requests. Can pass it
a match label selector object from a Kubernetes resource or individually defined label selectors.
(dd95e)[https://github.com/containership/kubernetes.client/commit/dd95ec8ba659e29665e90150e3fed8447a54c825]

## v0.2.1

### Features for v0.2.1

* Add ability to pass optional request arguments for KubernetesClient.request(...)
(ae83)[https://github.com/containership/kubernetes.client/commit/ae837c0e3ddf3d9176bcf8b25417942364d4df35]

## v0.2.0

### Features for v0.2.0

* Added open api spec for Kubernetes 1.12
(6589)[https://github.com/containership/kubernetes.client/commit/658985112c1cc2125385005b0f05f8ea846f4076]
* Add ability to fetch CRs from a cluster
(de4a)[https://github.com/containership/kubernetes.client/commit/de4a235c6725f85964b088d3bed3823a9456d68e]

### Bug Fixes for v0.2.0

* Fixed quoting of paths in _get so that `.` are correctly parsed
(65e3)[https://github.com/containership/kubernetes.client/commit/65e3d48531c9f0ace2a098ae44bf095669f77516]

## v0.1.2

### Features for v0.1.2

* Increased raw request functionality
(87fa)[https://github.com/containership/kubernetes.client/commit/87fa01237b71f2460a78cf78a5c880880ae1febe]

## v0.1.1

### Features for v0.1.1

* Initial client library commit
