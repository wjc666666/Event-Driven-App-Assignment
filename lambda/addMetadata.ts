import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSEvent, SNSEventRecord } from 'aws-lambda';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const ALLOWED_TYPES = ['Caption', 'Date', 'name'] as const;
type MetadataType = typeof ALLOWED_TYPES[number];

interface Message {
    id: string;
    value: string;
}

export const handler = async (event: SNSEvent): Promise<{ statusCode: number; body: string }> => {
    try {
        for (const record of event.Records) {
            await processRecord(record);
        }
        return { statusCode: 200, body: 'Add Metadata Lambda executed successfully.' };
    } catch (error) {
        console.error('Error processing SNS event:', error);
        throw error;
    }
};

async function processRecord(record: SNSEventRecord): Promise<void> {
    try {
        const sns = record.Sns;
        const message = JSON.parse(sns.Message) as Message;
        
        // Extract metadata type from message attributes
        const metadataTypeAttr = sns.MessageAttributes?.metadata_type;
        if (!metadataTypeAttr) {
            console.warn('Missing metadata_type attribute in message');
            return;
        }
        
        const metadataType = metadataTypeAttr.Value;
        const id = message.id;
        const value = message.value;

        if (!id || !value || !metadataType) {
            console.warn('Missing required fields in message:', { id, value, metadataType });
            return;
        }

        if (!ALLOWED_TYPES.includes(metadataType as MetadataType)) {
            console.error(`Invalid metadata type: ${metadataType}`);
            return;
        }

        console.log(`Updating metadata for image ${id}: ${metadataType} = ${value}`);

        await dynamodb.send(new UpdateCommand({
            TableName: process.env.IMAGE_TABLE,
            Key: { id },
            UpdateExpression: `set #attr = :val, updatedAt = :now`,
            ExpressionAttributeNames: { '#attr': metadataType },
            ExpressionAttributeValues: { 
                ':val': value,
                ':now': new Date().toISOString()
            }
        }));

        console.log(`Successfully updated metadata for image ${id}`);
    } catch (error) {
        console.error('Error processing record:', error);
        throw error;
    }
} 