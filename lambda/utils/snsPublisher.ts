import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface StatusUpdateMessage {
    id: string;
    date: string;
    update: {
        status: 'Approved' | 'Rejected';
        reason: string;
    };
}

export class SNSPublisher {
    private snsClient: SNSClient;
    private topicArn: string;

    constructor() {
        this.snsClient = new SNSClient({});
        this.topicArn = process.env.STATUS_UPDATE_TOPIC_ARN!;
    }

    async publish(message: StatusUpdateMessage): Promise<void> {
        const params = {
            TopicArn: this.topicArn,
            Message: JSON.stringify(message)
        };

        await this.snsClient.send(new PublishCommand(params));
    }
} 