import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

interface ImageLog {
    id: string;
    photographerId: string;
    uploadDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    metadata: {
        filename: string;
        size: number;
        type: string;
        location: string;
    };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Request body is required' })
            };
        }

        const imageData = JSON.parse(event.body) as ImageLog;
        
        // Validate required fields
        if (!imageData.id || !imageData.photographerId || !imageData.metadata) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields' })
            };
        }

        // Set default status to Pending
        imageData.status = 'Pending';
        imageData.uploadDate = new Date().toISOString();

        // Upload image to S3
        const s3Params = {
            Bucket: process.env.IMAGES_BUCKET_NAME!,
            Key: `images/${imageData.id}/${imageData.metadata.filename}`,
            Body: Buffer.from(imageData.metadata.location, 'base64'),
            ContentType: imageData.metadata.type
        };

        await s3Client.send(new PutObjectCommand(s3Params));

        // Log image information to DynamoDB
        const dynamoParams = {
            TableName: process.env.IMAGES_TABLE_NAME!,
            Item: {
                id: imageData.id,
                photographerId: imageData.photographerId,
                uploadDate: imageData.uploadDate,
                status: imageData.status,
                metadata: imageData.metadata
            }
        };

        await docClient.send(new PutCommand(dynamoParams));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Image logged successfully',
                imageId: imageData.id
            })
        };
    } catch (error) {
        console.error('Error logging image:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
}; 