import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSEvent, SQSRecord } from 'aws-lambda';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

interface S3Event {
    Records: Array<{
        s3: {
            bucket: {
                name: string;
            };
            object: {
                key: string;
            };
        };
    }>;
}

const ALLOWED_EXTENSIONS = ['.jpeg', '.png'];

export const handler = async (event: SQSEvent): Promise<{ statusCode: number; body: string }> => {
    try {
        for (const record of event.Records) {
            await processRecord(record);
        }
        return { statusCode: 200, body: 'Log Image Lambda executed successfully.' };
    } catch (error) {
        console.error('Error processing SQS event:', error);
        throw error; // Let SQS handle retry
    }
};

async function processRecord(record: SQSRecord): Promise<void> {
    try {
        const message = JSON.parse(record.body) as S3Event;
        const s3Info = message.Records?.[0]?.s3;
        
        if (!s3Info) {
            console.warn('No S3 information found in message');
            return;
        }

        const fileName = s3Info.object.key;
        const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            console.error(`Invalid file type: ${fileName}`);
            throw new Error(`Invalid file type: ${fileName}`);
        }

        console.log(`Processing valid image: ${fileName}`);

        await dynamodb.send(new PutCommand({
            TableName: process.env.IMAGE_TABLE,
            Item: { 
                id: fileName,
                createdAt: new Date().toISOString(),
                status: 'Pending'
            }
        }));

        console.log(`Successfully logged image: ${fileName}`);
    } catch (error) {
        console.error('Error processing record:', error);
        throw error;
    }
} 