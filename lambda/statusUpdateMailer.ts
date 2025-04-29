import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({});

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

        // Send email notification to photographer
        await ses.send(new SendEmailCommand({
            Source: process.env.SENDER_EMAIL,
            Destination: {
                ToAddresses: [process.env.PHOTOGRAPHER_EMAIL]
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
    }

    return { statusCode: 200, body: 'Status Update Mailer Lambda executed.' };
}; 