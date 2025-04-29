import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const handler = async (event: any) => {
    for (const record of event.Records) {
        const message = JSON.parse(record.body);
        const s3Info = message.Records ? message.Records[0].s3 : null;
        if (!s3Info) continue;

        const bucket = s3Info.bucket.name;
        const key = s3Info.object.key;

        // Delete invalid file from S3
        await s3.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        }));
    }

    return { statusCode: 200, body: 'Remove Image Lambda executed.' };
}; 