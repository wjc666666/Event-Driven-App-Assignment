import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const photographerId = event.pathParameters?.photographerId;
        
        if (!photographerId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Photographer ID is required' })
            };
        }

        // Query DynamoDB for all images by this photographer
        const queryParams = {
            TableName: process.env.IMAGES_TABLE_NAME!,
            IndexName: 'PhotographerIdIndex', // You'll need to create this GSI
            KeyConditionExpression: 'photographerId = :photographerId',
            ExpressionAttributeValues: {
                ':photographerId': photographerId
            }
        };

        const result = await docClient.send(new QueryCommand(queryParams));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully retrieved photographer images',
                images: result.Items
            })
        };
    } catch (error) {
        console.error('Error retrieving photographer images:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}; 