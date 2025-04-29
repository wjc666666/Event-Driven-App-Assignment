import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSPublisher } from './utils/snsPublisher';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsPublisher = new SNSPublisher();

interface StatusUpdate {
    id: string;
    status: 'Approved' | 'Rejected';
    reason: string;
    moderatorId: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Request body is required' })
            };
        }

        const updateData = JSON.parse(event.body) as StatusUpdate;
        
        // Validate required fields
        if (!updateData.id || !updateData.status || !updateData.reason || !updateData.moderatorId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields' })
            };
        }

        // Update image status in DynamoDB
        const updateParams = {
            TableName: process.env.IMAGES_TABLE_NAME!,
            Key: { id: updateData.id },
            UpdateExpression: 'SET #status = :status, #reason = :reason, #moderatorId = :moderatorId, #updateDate = :updateDate',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#reason': 'reason',
                '#moderatorId': 'moderatorId',
                '#updateDate': 'updateDate'
            },
            ExpressionAttributeValues: {
                ':status': updateData.status,
                ':reason': updateData.reason,
                ':moderatorId': updateData.moderatorId,
                ':updateDate': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW' as const
        };

        const result = await docClient.send(new UpdateCommand(updateParams));

        // Publish status update to SNS topic
        await snsPublisher.publish({
            id: updateData.id,
            date: new Date().toISOString(),
            update: {
                status: updateData.status,
                reason: updateData.reason
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Image status updated successfully',
                image: result.Attributes
            })
        };
    } catch (error) {
        console.error('Error updating image status:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}; 