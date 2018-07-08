@Library('containership-jenkins@v3')
import io.containership.*

def dockerUtils = new Docker(this)
def gitUtils = new Git(this)
def npmUtils = new Npm(this)
def pipelineUtils = new Pipeline(this)
def kubectlUtils = new Kubectl(this)

pipelineUtils.jenkinsWithNodeTemplate {
    def docker_org = 'containership'
    def docker_name = 'kubernetes.client'
    def docker_full_name = "${docker_org}/${docker_name}"
    def dockerfile = 'Dockerfile'
    def stage_deploy_branch = 'master'

    def docker_tag
    def docker_image_id
    def git_branch

    stage('Checkout') {
        def scmVars = checkout scm
        git_branch = scmVars.GIT_BRANCH

        if(gitUtils.isTagBuild(git_branch)) {
            docker_tag = git_branch
        } else {
            docker_tag = scmVars.GIT_COMMIT
        }
    }

    stage('Test Preparation') {
        container('docker') {
            dockerUtils.buildImage("${docker_full_name}:${docker_tag}", dockerfile)
            docker_image_id = dockerUtils.getImageId(docker_full_name, docker_tag)
        }
    }

    stage('Test - Lint') {
        container('docker') {
            dockerUtils.runShellCommand(docker_image_id, 'yarn run lint')
        }
    }

    stage('Cleanup') {
        echo "No Cleanup Needed!"
    }
}
