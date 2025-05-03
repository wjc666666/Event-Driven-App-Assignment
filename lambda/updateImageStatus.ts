import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

interface StatusUpdateMessage {
  id: string;
  date: string;
  update: {
    status: string;
    reason: string;
  }
}

export const handler = async (event: SNSEvent): Promise<{ statusCode: number; body: string }> => {
  try {
    for (const record of event.Records) {
      await processStatusUpdate(record);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Status updates processed successfully' })
    };
  } catch (error) {
    console.error('Error processing status updates:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: String(error) })
    };
  }
};

async function processStatusUpdate(record: any): Promise<void> {
  try {
    const message = JSON.parse(record.Sns.Message) as StatusUpdateMessage;
    
    // Validate message format
    if (!message.id || !message.date || !message.update || 
        !message.update.status || !message.update.reason) {
      console.error('Invalid message format:', message);
      return;
    }

    // Validate status value - only "Pass" or "Reject" are allowed
    const status = message.update.status;
    if (status !== 'Pass' && status !== 'Reject') {
      console.error(`Invalid status value: ${status}. Must be 'Pass' or 'Reject'`);
      return;
    }

    console.log(`Updating status for image ${message.id} to ${status}`);
    
    // Update image record in DynamoDB
    const updateParams = {
      TableName: process.env.IMAGE_TABLE,
      Key: { id: message.id },
      UpdateExpression: 'SET #status = :status, #reason = :reason, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#reason': 'reason',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':reason': message.update.reason,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW' as const
    };
    
    const result = await docClient.send(new UpdateCommand(updateParams));
    console.log('Image status updated successfully:', result.Attributes);
    
    // Publish message to status notification topic
    if (process.env.STATUS_NOTIFICATION_TOPIC) {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.STATUS_NOTIFICATION_TOPIC,
        Message: JSON.stringify({
          imageId: message.id,
          status: status,
          reason: message.update.reason,
          date: message.date,
          updatedAt: new Date().toISOString()
        }),
        MessageAttributes: {
          'message_type': {
            DataType: 'String',
            StringValue: 'StatusUpdate'
          }
        }
      }));
      
      console.log(`Status notification published for image ${message.id}`);
    }
  } catch (error) {
    console.error('Error processing status update:', error);
    throw error;
  }
} 