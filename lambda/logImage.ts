import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    // SQS event may contain multiple records
    for (const record of event.Records) {
        const message = JSON.parse(record.body);
        const s3Info = message.Records ? message.Records[0].s3 : null;
        if (!s3Info) continue;

        const fileName = s3Info.object.key;
        // Only allow .jpeg or .png
        if (!fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
            // Throw error to send message to DLQ
            throw new Error('Invalid file type: ' + fileName);
        }

        // Write to DynamoDB (skeleton, no attributes yet)
        await dynamodb.send(new PutCommand({
            TableName: process.env.IMAGE_TABLE,
            Item: { id: fileName }
        }));
    }

    return { statusCode: 200, body: 'Log Image Lambda executed.' };
}; 