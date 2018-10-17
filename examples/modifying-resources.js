/* eslint-disable */
'use strict';

const KubernetesClient = require('../index.js').Client;


async function createResources() {
  const client = new KubernetesClient({
      config: KubernetesClient.Config.fromKubeConfig(),
  });
  await client.loadSpec()

  // get all deployments in the `default` namespace
  try {
  const deployments = await client.resources.Deployment.post({
    metadata: {
      name: 'sample-redis-deploy',
      namespace: 'default',
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'redis'
        },
      },
      template: {
        metadata: {
          labels: {
            app: 'redis',
          }
        },
        spec: {
          containers: [
            {
              name: 'redis',
              image: 'redis'
            }
          ]
        }
      }
    }
  })
  } catch(e) {
    console.error(e)
  }

  // get deployment we just created
  const deps = await client.resources.Deployment.namespace('default').get('sample-redis-deploy')

  // delete and cleanup the deployment that was just created
  await client.resources.Deployment.namespace('default').delete('sample-redis-deploy')
}

createResources()
