import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as path from 'path';

export class EventDrivenAppAssignmentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for images
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `${id.toLowerCase()}-images-${this.account}`,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Create DynamoDB table
    const imagesTable = new dynamodb.Table(this, 'ImagesTable', {
      tableName: `${id.toLowerCase()}-images`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create SNS topic for events
    const imageEventsTopic = new sns.Topic(this, 'ImageEventsTopic', {
      topicName: `${id.toLowerCase()}-image-events`,
    });

    // Create SQS Dead Letter Queue
    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `${id.toLowerCase()}-dlq`,
    });

    // Add Lambda functions
    const logNewImageFunction = new lambda.Function(this, 'LogNewImageFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'logNewImage.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'sh', '-c', [
              'npm install',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'cp -r node_modules /asset-output/'
            ].join(' && ')
          ],
          local: {
            tryBundle(outputDir: string) {
              try {
                const lambdaDir = path.join(__dirname, '../lambda');
                require('child_process').execSync('npm install', { cwd: lambdaDir });
                require('child_process').execSync('npm run build', { cwd: lambdaDir });
                require('fs-extra').copySync(path.join(lambdaDir, 'dist'), outputDir);
                require('fs-extra').copySync(path.join(lambdaDir, 'node_modules'), path.join(outputDir, 'node_modules'));
                return true;
              } catch (error) {
                console.error('Local bundling failed:', error);
                return false;
              }
            }
          }
        },
      }),
      environment: {
        IMAGE_TABLE: imagesTable.tableName,
        BUCKET_NAME: imagesBucket.bucketName,
        NODE_OPTIONS: '--enable-source-maps',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Add Metadata Lambda function
    const addMetadataFunction = new lambda.Function(this, 'AddMetadataFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'addMetadata.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'sh', '-c', [
              'npm install',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'cp -r node_modules /asset-output/'
            ].join(' && ')
          ],
          local: {
            tryBundle(outputDir: string) {
              try {
                const lambdaDir = path.join(__dirname, '../lambda');
                require('child_process').execSync('npm install', { cwd: lambdaDir });
                require('child_process').execSync('npm run build', { cwd: lambdaDir });
                require('fs-extra').copySync(path.join(lambdaDir, 'dist'), outputDir);
                require('fs-extra').copySync(path.join(lambdaDir, 'node_modules'), path.join(outputDir, 'node_modules'));
                return true;
              } catch (error) {
                console.error('Local bundling failed:', error);
                return false;
              }
            }
          }
        },
      }),
      environment: {
        IMAGE_TABLE: imagesTable.tableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Update Image Status Lambda function
    const updateImageStatusFunction = new lambda.Function(this, 'UpdateImageStatusFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'updateImageStatus.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'sh', '-c', [
              'npm install',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'cp -r node_modules /asset-output/'
            ].join(' && ')
          ],
          local: {
            tryBundle(outputDir: string) {
              try {
                const lambdaDir = path.join(__dirname, '../lambda');
                require('child_process').execSync('npm install', { cwd: lambdaDir });
                require('child_process').execSync('npm run build', { cwd: lambdaDir });
                require('fs-extra').copySync(path.join(lambdaDir, 'dist'), outputDir);
                require('fs-extra').copySync(path.join(lambdaDir, 'node_modules'), path.join(outputDir, 'node_modules'));
                return true;
              } catch (error) {
                console.error('Local bundling failed:', error);
                return false;
              }
            }
          }
        },
      }),
      environment: {
        IMAGE_TABLE: imagesTable.tableName,
        STATUS_NOTIFICATION_TOPIC: imageEventsTopic.topicArn,
        NODE_OPTIONS: '--enable-source-maps',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Status Update Mailer Lambda function
    const statusUpdateMailerFunction = new lambda.Function(this, 'StatusUpdateMailerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'statusUpdateMailer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'sh', '-c', [
              'npm install',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'cp -r node_modules /asset-output/'
            ].join(' && ')
          ],
          local: {
            tryBundle(outputDir: string) {
              try {
                const lambdaDir = path.join(__dirname, '../lambda');
                require('child_process').execSync('npm install', { cwd: lambdaDir });
                require('child_process').execSync('npm run build', { cwd: lambdaDir });
                require('fs-extra').copySync(path.join(lambdaDir, 'dist'), outputDir);
                require('fs-extra').copySync(path.join(lambdaDir, 'node_modules'), path.join(outputDir, 'node_modules'));
                return true;
              } catch (error) {
                console.error('Local bundling failed:', error);
                return false;
              }
            }
          }
        },
      }),
      environment: {
        SENDER_EMAIL: 'noreply@example.com', // Replace with actual sender email
        PHOTOGRAPHER_EMAIL: 'photographer@example.com', // Replace with photographer email
        NODE_OPTIONS: '--enable-source-maps',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Grant permissions
    imagesBucket.grantReadWrite(logNewImageFunction);
    imagesTable.grantReadWriteData(logNewImageFunction);
    imagesTable.grantReadWriteData(addMetadataFunction);
    imagesTable.grantReadWriteData(updateImageStatusFunction);
    imageEventsTopic.grantPublish(updateImageStatusFunction);

    // Add SNS topic subscriptions with filter policies
    
    // Add Metadata Lambda subscribes only to metadata messages
    imageEventsTopic.addSubscription(new subscriptions.LambdaSubscription(addMetadataFunction, {
      filterPolicy: {
        metadata_type: sns.SubscriptionFilter.stringFilter({
          allowlist: ['Caption', 'Date', 'name']
        })
      },
      deadLetterQueue: dlq
    }));
    
    // Update Image Status Lambda subscribes only to status update messages (no message attributes)
    imageEventsTopic.addSubscription(new subscriptions.LambdaSubscription(updateImageStatusFunction, {
      filterPolicy: {
        // Using an empty filter policy but filtering in the Lambda function
        // Since we need to check the message body which isn't directly supported in filterPolicy
      },
      deadLetterQueue: dlq
    }));
    
    // Status Update Mailer subscribes to messages with status updates for notification
    imageEventsTopic.addSubscription(new subscriptions.LambdaSubscription(statusUpdateMailerFunction, {
      filterPolicy: {
        message_type: sns.SubscriptionFilter.stringFilter({
          allowlist: ['StatusUpdate']
        })
      },
      deadLetterQueue: dlq
    }));

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ImagesApi', {
      restApiName: 'Images Service',
      description: 'API for image management',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const images = api.root.addResource('images');
    images.addMethod('POST', new apigateway.LambdaIntegration(logNewImageFunction));

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: imagesBucket.bucketName,
      description: 'Name of the S3 bucket for storing images',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: imagesTable.tableName,
      description: 'Name of the DynamoDB table for storing image metadata',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });
    
    new cdk.CfnOutput(this, 'TopicArn', {
      value: imageEventsTopic.topicArn,
      description: 'ARN of the SNS topic for image events',
    });
  }
} 