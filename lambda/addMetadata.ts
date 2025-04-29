import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const ALLOWED_TYPES = ['Caption', 'Date', 'name'] as const;
type MetadataType = typeof ALLOWED_TYPES[number];

interface Message {
    id: string;
    value: string;
}

interface MessageAttributes {
    metadata_type: {
        Value: string;
    };
}

export const handler = async (event: any) => {
    for (const record of event.Records) {
        const sns = record.Sns;
        const message = JSON.parse(sns.Message) as Message;
        const attributes = sns.MessageAttributes as MessageAttributes;

        const id = message.id;
        const value = message.value;
        const metadataType = attributes?.metadata_type?.Value;

        if (!ALLOWED_TYPES.includes(metadataType as MetadataType)) {
            console.log('Invalid metadata type:', metadataType);
            continue;
        }

        // Update DynamoDB item
        await dynamodb.send(new UpdateCommand({
            TableName: process.env.IMAGE_TABLE,
            Key: { id },
            UpdateExpression: `set #attr = :val`,
            ExpressionAttributeNames: { '#attr': metadataType },
            ExpressionAttributeValues: { ':val': value }
        }));
    }

    return { statusCode: 200, body: 'Add Metadata Lambda executed.' };
}; 