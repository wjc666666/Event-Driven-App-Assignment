"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDrivenAppAssignmentStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const subscriptions = __importStar(require("aws-cdk-lib/aws-sns-subscriptions"));
const lambdaEventSources = __importStar(require("aws-cdk-lib/aws-lambda-event-sources"));
const s3n = __importStar(require("aws-cdk-lib/aws-s3-notifications"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
// import * as sqs from 'aws-cdk-lib/aws-sqs';
class EventDrivenAppAssignmentStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                IMAGE_TABLE: imageTable.tableName
            }
        });
        imageTable.grantWriteData(logImageFn);
        const addMetadataFn = new lambda.Function(this, 'AddMetadataFn', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'addMetadata.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                IMAGE_TABLE: imageTable.tableName
            }
        });
        imageTable.grantWriteData(addMetadataFn);
        const updateStatusFn = new lambda.Function(this, 'UpdateStatusFn', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'updateStatus.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                IMAGE_TABLE: imageTable.tableName
            }
        });
        imageTable.grantWriteData(updateStatusFn);
        const removeImageFn = new lambda.Function(this, 'RemoveImageFn', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'removeImage.handler',
            code: lambda.Code.fromAsset('lambda')
        });
        imageBucket.grantDelete(removeImageFn);
        const statusUpdateMailerFn = new lambda.Function(this, 'StatusUpdateMailerFn', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'statusUpdateMailer.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                SENDER_EMAIL: 'your-sender@example.com',
                PHOTOGRAPHER_EMAIL: 'photographer@example.com'
            }
        });
        // Grant SES permissions
        statusUpdateMailerFn.addToRolePolicy(new iam.PolicyStatement({
            actions: ['ses:SendEmail', 'ses:SendRawEmail'],
            resources: ['*']
        }));
        // S3 triggers SNS Topic on object creation
        imageBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.SnsDestination(topic));
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
        // Add the new Lambda function for getting photographer images
        const getPhotographerImagesFn = new lambda.Function(this, 'GetPhotographerImagesFn', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'getPhotographerImages.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                IMAGES_TABLE_NAME: imageTable.tableName
            }
        });
        // Grant the Lambda function read access to the DynamoDB table
        imageTable.grantReadData(getPhotographerImagesFn);
        // Add API Gateway endpoint
        const api = new apigateway.RestApi(this, 'PhotoGalleryApi', {
            restApiName: 'Photo Gallery API',
            description: 'API for the Photo Gallery application'
        });
        const photographers = api.root.addResource('photographers');
        const photographerImages = photographers.addResource('{photographerId}').addResource('images');
        photographerImages.addMethod('GET', new apigateway.LambdaIntegration(getPhotographerImagesFn));
        // Add GSI to the DynamoDB table for querying by photographer
        imageTable.addGlobalSecondaryIndex({
            indexName: 'PhotographerIdIndex',
            partitionKey: { name: 'photographerId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL
        });
        // example resource
        // const queue = new sqs.Queue(this, 'EventDrivenAppAssignmentQueue', {
        //   visibilityTimeout: cdk.Duration.seconds(300)
        // });
    }
}
exports.EventDrivenAppAssignmentStack = EventDrivenAppAssignmentStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtZHJpdmVuIGFwcCBhc3NpZ25tZW50LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2V2ZW50LWRyaXZlbiBhcHAgYXNzaWdubWVudC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUVuQyx1REFBeUM7QUFDekMseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQywrREFBaUQ7QUFDakQsbUVBQXFEO0FBQ3JELGlGQUFtRTtBQUNuRSx5RkFBMkU7QUFDM0Usc0VBQXdEO0FBQ3hELHlEQUEyQztBQUMzQyx1RUFBeUQ7QUFDekQsOENBQThDO0FBRTlDLE1BQWEsNkJBQThCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDMUQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qiw2Q0FBNkM7UUFFN0MsOEJBQThCO1FBQzlCLE1BQU0sV0FBVyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFdkQsbUNBQW1DO1FBQ25DLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFaEQsd0JBQXdCO1FBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFdkMsMkNBQTJDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzlDLGVBQWUsRUFBRTtnQkFDZixlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLEdBQUc7YUFDWDtTQUNGLENBQUMsQ0FBQztRQUVILG1DQUFt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QUNuRSxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHO1NBQzVDLENBQUMsQ0FBQztRQUVILG1CQUFtQjtRQUNuQix1RUFBdUU7UUFDdkUsaURBQWlEO1FBQ2pELE1BQU07SUFDUixDQUFDO0NBQ0Y7QUE5SkQsc0VBOEpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBzdWJzY3JpcHRpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMtc3Vic2NyaXB0aW9ucyc7XG5pbXBvcnQgKiBhcyBsYW1iZGFFdmVudFNvdXJjZXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ldmVudC1zb3VyY2VzJztcbmltcG9ydCAqIGFzIHMzbiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtbm90aWZpY2F0aW9ucyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5Jztcbi8vIGltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcblxuZXhwb3J0IGNsYXNzIEV2ZW50RHJpdmVuQXBwQXNzaWdubWVudFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gVGhlIGNvZGUgdGhhdCBkZWZpbmVzIHlvdXIgc3RhY2sgZ29lcyBoZXJlXG5cbiAgICAvLyBTMyBidWNrZXQgZm9yIGltYWdlIHVwbG9hZHNcbiAgICBjb25zdCBpbWFnZUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0ltYWdlQnVja2V0Jyk7XG5cbiAgICAvLyBTTlMgdG9waWMgZm9yIGV2ZW50IGRpc3RyaWJ1dGlvblxuICAgIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnSW1hZ2VUb3BpYycpO1xuXG4gICAgLy8gU1FTIERlYWQgTGV0dGVyIFF1ZXVlXG4gICAgY29uc3QgZGxxID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnRExRJyk7XG5cbiAgICAvLyBTUVMgUXVldWUgZm9yIGltYWdlIHByb2Nlc3NpbmcsIHdpdGggRExRXG4gICAgY29uc3QgcXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdJbWFnZVF1ZXVlJywge1xuICAgICAgZGVhZExldHRlclF1ZXVlOiB7XG4gICAgICAgIG1heFJlY2VpdmVDb3VudDogMyxcbiAgICAgICAgcXVldWU6IGRscVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vREIgdGFibGUgZm9yIGltYWdlIHJlY29yZHNcbiAgICBjb25zdCBpbWFnZVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdJbWFnZVRhYmxlJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH1cbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBza2VsZXRvbnMgKGhhbmRsZXJzIHRvIGJlIGltcGxlbWVudGVkIGxhdGVyKVxuICAgIGNvbnN0IGxvZ0ltYWdlRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdMb2dJbWFnZUZuJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnbG9nSW1hZ2UuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYScpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgSU1BR0VfVEFCTEU6IGltYWdlVGFibGUudGFibGVOYW1lXG4gICAgICB9XG4gICAgfSk7XG4gICAgaW1hZ2VUYWJsZS5ncmFudFdyaXRlRGF0YShsb2dJbWFnZUZuKTtcblxuICAgIGNvbnN0IGFkZE1ldGFkYXRhRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdBZGRNZXRhZGF0YUZuJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnYWRkTWV0YWRhdGEuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYScpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgSU1BR0VfVEFCTEU6IGltYWdlVGFibGUudGFibGVOYW1lXG4gICAgICB9XG4gICAgfSk7XG4gICAgaW1hZ2VUYWJsZS5ncmFudFdyaXRlRGF0YShhZGRNZXRhZGF0YUZuKTtcblxuICAgIGNvbnN0IHVwZGF0ZVN0YXR1c0ZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnVXBkYXRlU3RhdHVzRm4nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICd1cGRhdGVTdGF0dXMuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYScpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgSU1BR0VfVEFCTEU6IGltYWdlVGFibGUudGFibGVOYW1lXG4gICAgICB9XG4gICAgfSk7XG4gICAgaW1hZ2VUYWJsZS5ncmFudFdyaXRlRGF0YSh1cGRhdGVTdGF0dXNGbik7XG5cbiAgICBjb25zdCByZW1vdmVJbWFnZUZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnUmVtb3ZlSW1hZ2VGbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ3JlbW92ZUltYWdlLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGEnKVxuICAgIH0pO1xuICAgIGltYWdlQnVja2V0LmdyYW50RGVsZXRlKHJlbW92ZUltYWdlRm4pO1xuXG4gICAgY29uc3Qgc3RhdHVzVXBkYXRlTWFpbGVyRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdTdGF0dXNVcGRhdGVNYWlsZXJGbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ3N0YXR1c1VwZGF0ZU1haWxlci5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTRU5ERVJfRU1BSUw6ICd5b3VyLXNlbmRlckBleGFtcGxlLmNvbScsXG4gICAgICAgIFBIT1RPR1JBUEhFUl9FTUFJTDogJ3Bob3RvZ3JhcGhlckBleGFtcGxlLmNvbSdcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBHcmFudCBTRVMgcGVybWlzc2lvbnNcbiAgICBzdGF0dXNVcGRhdGVNYWlsZXJGbi5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogWydzZXM6U2VuZEVtYWlsJywgJ3NlczpTZW5kUmF3RW1haWwnXSxcbiAgICAgIHJlc291cmNlczogWycqJ11cbiAgICB9KSk7XG5cbiAgICAvLyBTMyB0cmlnZ2VycyBTTlMgVG9waWMgb24gb2JqZWN0IGNyZWF0aW9uXG4gICAgaW1hZ2VCdWNrZXQuYWRkRXZlbnROb3RpZmljYXRpb24oXG4gICAgICBzMy5FdmVudFR5cGUuT0JKRUNUX0NSRUFURUQsXG4gICAgICBuZXcgczNuLlNuc0Rlc3RpbmF0aW9uKHRvcGljKVxuICAgICk7XG5cbiAgICAvLyBTTlMgVG9waWMgc3Vic2NyaXB0aW9ucyB3aXRoIGZpbHRlciBwb2xpY2llc1xuICAgIC8vIDEuIFNRUyBRdWV1ZTogb25seSByZWNlaXZlcyBpbWFnZSB1cGxvYWQgZXZlbnRzXG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBzdWJzY3JpcHRpb25zLlNxc1N1YnNjcmlwdGlvbihxdWV1ZSwge1xuICAgICAgZmlsdGVyUG9saWN5OiB7XG4gICAgICAgIGV2ZW50VHlwZTogc25zLlN1YnNjcmlwdGlvbkZpbHRlci5zdHJpbmdGaWx0ZXIoe1xuICAgICAgICAgIGFsbG93bGlzdDogWydJbWFnZVVwbG9hZCddXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgLy8gMi4gQWRkIE1ldGFkYXRhIExhbWJkYTogb25seSByZWNlaXZlcyBtZXRhZGF0YSBldmVudHNcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnNjcmlwdGlvbnMuTGFtYmRhU3Vic2NyaXB0aW9uKGFkZE1ldGFkYXRhRm4sIHtcbiAgICAgIGZpbHRlclBvbGljeToge1xuICAgICAgICBldmVudFR5cGU6IHNucy5TdWJzY3JpcHRpb25GaWx0ZXIuc3RyaW5nRmlsdGVyKHtcbiAgICAgICAgICBhbGxvd2xpc3Q6IFsnQWRkTWV0YWRhdGEnXVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pKTtcblxuICAgIC8vIDMuIFVwZGF0ZSBTdGF0dXMgTGFtYmRhOiBvbmx5IHJlY2VpdmVzIHN0YXR1cyB1cGRhdGUgZXZlbnRzXG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBzdWJzY3JpcHRpb25zLkxhbWJkYVN1YnNjcmlwdGlvbih1cGRhdGVTdGF0dXNGbiwge1xuICAgICAgZmlsdGVyUG9saWN5OiB7XG4gICAgICAgIGV2ZW50VHlwZTogc25zLlN1YnNjcmlwdGlvbkZpbHRlci5zdHJpbmdGaWx0ZXIoe1xuICAgICAgICAgIGFsbG93bGlzdDogWydVcGRhdGVTdGF0dXMnXVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pKTtcblxuICAgIC8vIFNRUyBRdWV1ZSB0cmlnZ2VycyBMb2cgSW1hZ2UgTGFtYmRhXG4gICAgbG9nSW1hZ2VGbi5hZGRFdmVudFNvdXJjZShuZXcgbGFtYmRhRXZlbnRTb3VyY2VzLlNxc0V2ZW50U291cmNlKHF1ZXVlKSk7XG5cbiAgICAvLyBETFEgdHJpZ2dlcnMgUmVtb3ZlIEltYWdlIExhbWJkYVxuICAgIHJlbW92ZUltYWdlRm4uYWRkRXZlbnRTb3VyY2UobmV3IGxhbWJkYUV2ZW50U291cmNlcy5TcXNFdmVudFNvdXJjZShkbHEpKTtcblxuICAgIC8vIEFkZCB0aGUgbmV3IExhbWJkYSBmdW5jdGlvbiBmb3IgZ2V0dGluZyBwaG90b2dyYXBoZXIgaW1hZ2VzXG4gICAgY29uc3QgZ2V0UGhvdG9ncmFwaGVySW1hZ2VzRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdHZXRQaG90b2dyYXBoZXJJbWFnZXNGbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2dldFBob3RvZ3JhcGhlckltYWdlcy5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBJTUFHRVNfVEFCTEVfTkFNRTogaW1hZ2VUYWJsZS50YWJsZU5hbWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHRoZSBMYW1iZGEgZnVuY3Rpb24gcmVhZCBhY2Nlc3MgdG8gdGhlIER5bmFtb0RCIHRhYmxlXG4gICAgaW1hZ2VUYWJsZS5ncmFudFJlYWREYXRhKGdldFBob3RvZ3JhcGhlckltYWdlc0ZuKTtcblxuICAgIC8vIEFkZCBBUEkgR2F0ZXdheSBlbmRwb2ludFxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1Bob3RvR2FsbGVyeUFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnUGhvdG8gR2FsbGVyeSBBUEknLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgZm9yIHRoZSBQaG90byBHYWxsZXJ5IGFwcGxpY2F0aW9uJ1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGhvdG9ncmFwaGVycyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdwaG90b2dyYXBoZXJzJyk7XG4gICAgY29uc3QgcGhvdG9ncmFwaGVySW1hZ2VzID0gcGhvdG9ncmFwaGVycy5hZGRSZXNvdXJjZSgne3Bob3RvZ3JhcGhlcklkfScpLmFkZFJlc291cmNlKCdpbWFnZXMnKTtcbiAgICBcbiAgICBwaG90b2dyYXBoZXJJbWFnZXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRQaG90b2dyYXBoZXJJbWFnZXNGbikpO1xuXG4gICAgLy8gQWRkIEdTSSB0byB0aGUgRHluYW1vREIgdGFibGUgZm9yIHF1ZXJ5aW5nIGJ5IHBob3RvZ3JhcGhlclxuICAgIGltYWdlVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnUGhvdG9ncmFwaGVySWRJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bob3RvZ3JhcGhlcklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RpbWVzdGFtcCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMXG4gICAgfSk7XG5cbiAgICAvLyBleGFtcGxlIHJlc291cmNlXG4gICAgLy8gY29uc3QgcXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdFdmVudERyaXZlbkFwcEFzc2lnbm1lbnRRdWV1ZScsIHtcbiAgICAvLyAgIHZpc2liaWxpdHlUaW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMDApXG4gICAgLy8gfSk7XG4gIH1cbn1cbiJdfQ==