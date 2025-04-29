import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

interface StatusUpdate {
    id: string;
    date: string;
    update: {
        status: 'Pass' | 'Reject';
        reason: string;
    };
}

export const handler = async (event: any) => {
    for (const record of event.Records) {
        const sns = record.Sns;
        const message = JSON.parse(sns.Message) as StatusUpdate;

        const { id, date, update } = message;
        const { status, reason } = update;

        // Update DynamoDB item with status and reason
        await dynamodb.send(new UpdateCommand({
            TableName: process.env.IMAGE_TABLE,
            Key: { id },
            UpdateExpression: 'set #status = :status, #reason = :reason, #date = :date',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#reason': 'reason',
                '#date': 'date'
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':reason': reason,
                ':date': date
            }
        }));
    }

    return { statusCode: 200, body: 'Update Status Lambda executed.' };
}; 