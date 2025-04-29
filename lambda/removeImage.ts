import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SQSEvent, SQSRecord } from 'aws-lambda';

const s3 = new S3Client({});

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

export const handler = async (event: SQSEvent): Promise<{ statusCode: number; body: string }> => {
    try {
        for (const record of event.Records) {
            await processRecord(record);
        }
        return { statusCode: 200, body: 'Remove Image Lambda executed successfully.' };
    } catch (error) {
        console.error('Error processing SQS event:', error);
        throw error;
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

        const bucket = s3Info.bucket.name;
        const key = s3Info.object.key;

        console.log(`Attempting to delete invalid file: ${key} from bucket: ${bucket}`);

        await s3.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        }));

        console.log(`Successfully deleted invalid file: ${key}`);
    } catch (error) {
        console.error('Error processing record:', error);
        throw error;
    }
} 