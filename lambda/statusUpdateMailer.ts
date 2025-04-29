import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSEvent, SNSEventRecord } from 'aws-lambda';

const ses = new SESClient({});

interface StatusUpdate {
    id: string;
    date: string;
    update: {
        status: 'Pass' | 'Reject';
        reason: string;
    };
}

export const handler = async (event: SNSEvent): Promise<{ statusCode: number; body: string }> => {
    try {
        for (const record of event.Records) {
            await processRecord(record);
        }
        return { statusCode: 200, body: 'Status Update Mailer Lambda executed successfully.' };
    } catch (error) {
        console.error('Error processing SNS event:', error);
        throw error;
    }
};

async function processRecord(record: SNSEventRecord): Promise<void> {
    try {
        const sns = record.Sns;
        const message = JSON.parse(sns.Message) as StatusUpdate;

        const { id, date, update } = message;
        const { status, reason } = update;

        if (!id || !date || !status || !reason) {
            console.warn('Missing required fields in message:', { id, date, status, reason });
            return;
        }

        if (!['Pass', 'Reject'].includes(status)) {
            console.error(`Invalid status: ${status}`);
            return;
        }

        const senderEmail = process.env.SENDER_EMAIL;
        const photographerEmail = process.env.PHOTOGRAPHER_EMAIL;

        if (!senderEmail || !photographerEmail) {
            console.error('Missing required environment variables: SENDER_EMAIL or PHOTOGRAPHER_EMAIL');
            return;
        }

        console.log(`Sending status update email for image ${id} to ${photographerEmail}`);

        await ses.send(new SendEmailCommand({
            Source: senderEmail,
            Destination: {
                ToAddresses: [photographerEmail]
            },
            Message: {
                Subject: {
                    Data: `Image ${id} Status Update: ${status}`
                },
                Body: {
                    Text: {
                        Data: `Your image ${id} has been ${status.toLowerCase()}ed.\nReason: ${reason}\nDate: ${date}`
                    }
                }
            }
        }));

        console.log(`Successfully sent status update email for image ${id}`);
    } catch (error) {
        console.error('Error processing record:', error);
        throw error;
    }
} 