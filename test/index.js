/* eslint-disable */
'use strict';

const KubernetesClient = require('../index.js').Client;

const client = new KubernetesClient({
    config: KubernetesClient.Config.fromKubeConfig(),
    version: '1.10'
});

const deployment = {
    metadata: {
        name: 'mydeployment',
        namespace: 'default'
    },
    spec: {
        selector: {
            matchLabels: {
                app: 'mydeployment'
            }
        },
        template: {
            metadata: {
                labels: {
                    app: 'mydeployment'
                }
            },
            spec: {
                containers: [
                    {
                        image: 'redis',
                        name: 'redis'
                    }
                ]
            }
        }
    }
};
async function run() {
    await client.loadSpec();

    try {
        let res = await client.resources.Deployment.post(deployment);
        console.log(res);
        res = await client.resources.Deployment.post(deployment);
        console.log(res);
    } catch(error) {
        console.error(error);
    }

    /*
  let res = await client.resources.Deployment.list()

  res = await client.resources.Deployment.post({
    metadata: {
      name: 'mydeployment',
      namespace: 'default',
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'mydeployment'
        }
      },
      template: {
        metadata: {
          labels: {
            app: 'mydeployment'
          }
        },
        spec: {
          containers: [
            {
              image: 'redis',
              name: 'redis'
            }
          ]
        }
      }
    }
  })
  console.log(res)

  res = await client.resources.Deployment.get('mydeployment')
  console.log(res)

  res = await client.resources.Deployment.put('mydeployment', {
    metadata: {
      name: 'mydeployment',
      namespace: 'default',
      labels: { what: 'now' },
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'mydeployment'
        }
      },
      template: {
        metadata: {
          labels: {
            app: 'mydeployment'
          }
        },
        spec: {
          containers: [
            {
              image: 'redis',
              name: 'redis'
            }
          ]
        }
      }
    }
  })
  console.log(res)

  res = await client.resources.Deployment.patch('mydeployment', {
    metadata: {
      labels: { what: 'nowhigh' },
    }
  })
  console.log(res)


  res = await client.resources.Deployment.delete('mydeployment')
  console.log(res)

  const res = await KubernetesClient.paginate(client.resources.Deployment.allNamespaces().limit(1))
  console.log(res)
    */
}

run();

//client.Deployment.namespace('').get('hmm')
//client.Deployment.namespace('').list({ count: 5 })

// KubernetesClient.paginate(client.Deployment.namespace('').list({ count: 5 }))
