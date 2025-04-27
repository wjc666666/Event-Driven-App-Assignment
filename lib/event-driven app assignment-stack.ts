import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
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

    // S3 triggers SNS Topic on object creation
    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(topic)
    );

    // SNS Topic subscriptions with filter policies
    // 1. SQS Queue: only receives image upload events
    topic.addSubscription(new subscriptions.SqsSubscription(queue, {
      filterPolicy: {
        eventType: sns.SubscriptionFilter.stringFilter({
          allowlist: ['ImageUpload']
        })
      }
    }));

    // 2. Add Metadata Lambda: only receives metadata events
    topic.addSubscription(new subscriptions.LambdaSubscription(addMetadataFn, {
      filterPolicy: {
        eventType: sns.SubscriptionFilter.stringFilter({
          allowlist: ['AddMetadata']
        })
      }
    }));

    // 3. Update Status Lambda: only receives status update events
    topic.addSubscription(new subscriptions.LambdaSubscription(updateStatusFn, {
      filterPolicy: {
        eventType: sns.SubscriptionFilter.stringFilter({
          allowlist: ['UpdateStatus']
        })
      }
    }));

    // SQS Queue triggers Log Image Lambda
    logImageFn.addEventSource(new lambdaEventSources.SqsEventSource(queue));

    // DLQ triggers Remove Image Lambda
    removeImageFn.addEventSource(new lambdaEventSources.SqsEventSource(dlq));

    // example resource
    // const queue = new sqs.Queue(this, 'EventDrivenAppAssignmentQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
