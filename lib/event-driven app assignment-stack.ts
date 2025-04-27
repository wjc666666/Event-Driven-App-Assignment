import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class EventDrivenAppAssignmentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // S3 bucket for image uploads
    const imageBucket = new s3.Bucket(this, 'ImageBucket');

    // SNS topic for event distribution
    const topic = new sns.Topic(this, 'ImageTopic');

    // SQS Dead Letter Queue
    const dlq = new sqs.Queue(this, 'DLQ');

    // SQS Queue for image processing, with DLQ
    const queue = new sqs.Queue(this, 'ImageQueue', {
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: dlq
      }
    });

    // DynamoDB table for image records
    const imageTable = new dynamodb.Table(this, 'ImageTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

    // Lambda function skeletons (handlers to be implemented later)
    const logImageFn = new lambda.Function(this, 'LogImageFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'logImage.handler',
      code: lambda.Code.fromAsset('lambda')
    });
    const addMetadataFn = new lambda.Function(this, 'AddMetadataFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'addMetadata.handler',
      code: lambda.Code.fromAsset('lambda')
    });
    const updateStatusFn = new lambda.Function(this, 'UpdateStatusFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'updateStatus.handler',
      code: lambda.Code.fromAsset('lambda')
    });
    const removeImageFn = new lambda.Function(this, 'RemoveImageFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'removeImage.handler',
      code: lambda.Code.fromAsset('lambda')
    });
    const statusUpdateMailerFn = new lambda.Function(this, 'StatusUpdateMailerFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'statusUpdateMailer.handler',
      code: lambda.Code.fromAsset('lambda')
    });

    // example resource
    // const queue = new sqs.Queue(this, 'EventDrivenAppAssignmentQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
