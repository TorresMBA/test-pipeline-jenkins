pipeline {
    agent none // Permite definir agentes distintos por cada stage

    environment {
        DEPLOY_HOST = 'host.docker.internal'
        DEPLOY_USER = 'deploy'
        DEPLOY_DIR = '/var/www/nodeapi-services'
        APP_NAME = 'mi-api'
    }

    stages {
        stage('Build & Test en Docker') {
            agent {
                docker {
                    image 'node:20-alpine'
                    // Reutiliza la caché de npm del host para builds ultra rápidos
                    args '-v /var/lib/jenkins/.npm:/root/.npm'
                }
            }
            steps {
                // Instala dependencias y prepara artefactos
                sh 'npm ci'
                // sh 'npm test' // Descomentar si tienes tests
                
                // Deja solo dependencias de producción para no saturar el servidor
                sh 'npm prune --omit=dev'
            }
        }

        stage('Deploy al Host') {

            agent any

            steps {
                sshagent(credentials: ['deploy-host-key']) {

                    sh '''
                        rsync -avz --delete \
                          -e "ssh -o StrictHostKeyChecking=no" \
                          --exclude='.git' \
                          --exclude='.env' \
                          --exclude='Jenkinsfile' \
                          ./ \
                          ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/
                    '''
                }
            }
        }


        stage('Recargar aplicación') {

            agent any

            steps {

                sshagent(credentials: ['deploy-host-key']) {

                    sh '''
                        ssh -o StrictHostKeyChecking=no \
                        ${DEPLOY_USER}@${DEPLOY_HOST} "
                            pm2 reload ${APP_NAME} || \
                            pm2 start ${DEPLOY_DIR}/src/index.js \
                            --name ${APP_NAME}
                        "
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "API desplegada y recargada con éxito en ${DEPLOY_DIR}"
        }
    }
}