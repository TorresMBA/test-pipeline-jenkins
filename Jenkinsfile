pipeline {
    agent any // Permite definir agentes distintos por cada stage

    environment {
        DEPLOY_HOST = 'host.docker.internal'
        DEPLOY_USER = 'deploy'
        DEPLOY_DIR = '/var/www/nodeapi-services'
        APP_NAME = 'mi-api'
        IMAGE_TAG = "${BUILD_NUMBER}"
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

        // stage('Deploy al Host') {

        //     agent any

        //     steps {
        //         sshagent(credentials: ['deploy-host-key']) {

        //             sh '''
        //                 rsync -avz --delete \
        //                   -e "ssh -o StrictHostKeyChecking=no" \
        //                   --exclude='.git' \
        //                   --exclude='.env' \
        //                   --exclude='Jenkinsfile' \
        //                   ./ \
        //                   ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/
        //             '''
        //         }
        //     }
        // }


        // stage('Recargar aplicación') {

        //     agent any

        //     steps {

        //         sshagent(credentials: ['deploy-host-key']) {

        //             sh '''
        //                 ssh -o StrictHostKeyChecking=no \
        //                 ${DEPLOY_USER}@${DEPLOY_HOST} "
        //                     pm2 reload ${APP_NAME} || \
        //                     pm2 start ${DEPLOY_DIR}/src/index.js \
        //                     --name ${APP_NAME}
        //                 "
        //             '''
        //         }
        //     }
        // }

        stage('Docker Build'){

		    steps {
				sh 'docker build -t ${APP_NAME}:${IMAGE_TAG} .'
		    }
		}

        stage('Docker Deploy') {

		    steps {
		        sh '''
		            echo "Deploying GREEN..."
		
		            docker rm -f ${APP_NAME}-green || true
		
		            docker run -d \
		                --name ${APP_NAME}-green \
		                -p 8084:3000 \
		                ${APP_NAME}:${IMAGE_TAG}
		        '''
		    }
		}

        stage('Health Check GREEN') {

		    steps {
		        script {
		            try {
		                sh '''
		                    sleep 3
		                    docker exec ${APP_NAME}-green node -e "fetch('http://127.0.0.1:3000/api/health').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"
		                '''
		            } catch (Exception e) {
			                sh 'docker ps -a --filter name=${APP_NAME}-green'
			                sh 'docker logs ${APP_NAME}-green || true'
		                sh 'docker rm -f ${APP_NAME}-green || true'
		
		                error "GREEN deployment failed"
		            }
		        }
		    }
		}

        stage('Switch to GREEN') {

		    steps {
		        sh '''
		            docker rm -f ${APP_NAME} || true
		
		            docker run -d \
		                --name ${APP_NAME} \
		                -p 8085:3000 \
		                ${APP_NAME}:${IMAGE_TAG}
		
		            docker rm -f ${APP_NAME}-green || true
		        '''
		    }
		}

        stage('Health Check Production') {

		    steps {
		        script {
		            try {
		                sh '''
		                    sleep 3
		                    docker exec ${APP_NAME} node -e "fetch('http://127.0.0.1:3000/api/health').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"
		                '''
		            } catch (Exception e) {
		
		                def previousBuild = currentBuild.previousSuccessfulBuild
		
		                if (previousBuild == null) {
		                    error "No previous successful build available"
		                }
		
		                def previousTag = previousBuild.number.toString()
		
		                echo "Rolling back to ${APP_NAME}:${previousTag}"
		
		                sh """
		                    docker rm -f ${APP_NAME} || true
		
		                    docker run -d \
		                        --name ${APP_NAME} \
		                        -p 8085:3000 \
		                        ${APP_NAME}:${previousTag}
		
		                    sleep 3
		
		                    docker exec ${APP_NAME} node -e "fetch('http://127.0.0.1:3000/api/health').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"
		                """
		
		                throw e
		            }
		        }
		    }
		}
    }

    post {
        success {
            echo "API desplegada y recargada con éxito en ${DEPLOY_DIR}"
        }
    }
}