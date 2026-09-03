pipeline {
    agent none // Permite definir agentes distintos por cada stage

    environment {
        DEPLOY_DIR = '/var/www/nodeapi-services'
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

        stage('Deploy y Recarga en Host') {
            agent any // Se ejecuta directo en el servidor Linux donde corre Jenkins
            steps {
                // 1. Sincronizar archivos al directorio final
                // IMPORTANTE: Se excluye .env para no sobreescribir las variables del servidor
                sh """
                    rsync -av --delete \
                        --exclude='.git' \
                        --exclude='.env' \
                        --exclude='Jenkinsfile' \
                        ./ ${DEPLOY_DIR}/
                """

                // 2. Recarga en caliente con PM2 (Zero-Downtime)
                sh """
                    pm2 reload mi-api || pm2 start ${DEPLOY_DIR}/src/index.js --name "mi-api"
                """
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