"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sns_1 = require("@aws-sdk/client-sns");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new client_sns_1.SNSClient({});
const handler = async (event) => {
    try {
        for (const record of event.Records) {
            await processStatusUpdate(record);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Status updates processed successfully' })
        };
    }
    catch (error) {
        console.error('Error processing status updates:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error', error: String(error) })
        };
    }
};
exports.handler = handler;
async function processStatusUpdate(record) {
    try {
        const message = JSON.parse(record.Sns.Message);
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
            ReturnValues: 'ALL_NEW'
        };
        const result = await docClient.send(new lib_dynamodb_1.UpdateCommand(updateParams));
        console.log('Image status updated successfully:', result.Attributes);
        // Publish message to status notification topic
        if (process.env.STATUS_NOTIFICATION_TOPIC) {
            await snsClient.send(new client_sns_1.PublishCommand({
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
    }
    catch (error) {
        console.error('Error processing status update:', error);
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlSW1hZ2VTdGF0dXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi91cGRhdGVJbWFnZVN0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQThFO0FBRTlFLG9EQUFnRTtBQUVoRSxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzVELE1BQU0sU0FBUyxHQUFHLElBQUksc0JBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQVc3QixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBZSxFQUFpRCxFQUFFO0lBQzlGLElBQUk7UUFDRixLQUFLLE1BQU0sTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDbEMsTUFBTSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNuQztRQUVELE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLHVDQUF1QyxFQUFFLENBQUM7U0FDM0UsQ0FBQztLQUNIO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pELE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLHVCQUF1QixFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztTQUNqRixDQUFDO0tBQ0g7QUFDSCxDQUFDLENBQUM7QUFqQlcsUUFBQSxPQUFPLFdBaUJsQjtBQUVGLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxNQUFXO0lBQzVDLElBQUk7UUFDRixNQUFNLE9BQU8s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eW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XHJcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFVwZGF0ZUNvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xyXG5pbXBvcnQgeyBTTlNFdmVudCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyBTTlNDbGllbnQsIFB1Ymxpc2hDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNucyc7XHJcblxyXG5jb25zdCBkeW5hbW9DbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xyXG5jb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oZHluYW1vQ2xpZW50KTtcclxuY29uc3Qgc25zQ2xpZW50ID0gbmV3IFNOU0NsaWVudCh7fSk7XHJcblxyXG5pbnRlcmZhY2UgU3RhdHVzVXBkYXRlTWVzc2FnZSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBkYXRlOiBzdHJpbmc7XHJcbiAgdXBkYXRlOiB7XHJcbiAgICBzdGF0dXM6IHN0cmluZztcclxuICAgIHJlYXNvbjogc3RyaW5nO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IFNOU0V2ZW50KTogUHJvbWlzZTx7IHN0YXR1c0NvZGU6IG51bWJlcjsgYm9keTogc3RyaW5nIH0+ID0+IHtcclxuICB0cnkge1xyXG4gICAgZm9yIChjb25zdCByZWNvcmQgb2YgZXZlbnQuUmVjb3Jkcykge1xyXG4gICAgICBhd2FpdCBwcm9jZXNzU3RhdHVzVXBkYXRlKHJlY29yZCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnU3RhdHVzIHVwZGF0ZXMgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScgfSlcclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3Npbmcgc3RhdHVzIHVwZGF0ZXM6JywgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdHVzQ29kZTogNTAwLFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLCBlcnJvcjogU3RyaW5nKGVycm9yKSB9KVxyXG4gICAgfTtcclxuICB9XHJcbn07XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzU3RhdHVzVXBkYXRlKHJlY29yZDogYW55KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKHJlY29yZC5TbnMuTWVzc2FnZSkgYXMgU3RhdHVzVXBkYXRlTWVzc2FnZTtcclxuICAgIFxyXG4gICAgLy8gVmFsaWRhdGUgbWVzc2FnZSBmb3JtYXRcclxuICAgIGlmICghbWVzc2FnZS5pZCB8fCAhbWVzc2FnZS5kYXRlIHx8ICFtZXNzYWdlLnVwZGF0ZSB8fCBcclxuICAgICAgICAhbWVzc2FnZS51cGRhdGUuc3RhdHVzIHx8ICFtZXNzYWdlLnVwZGF0ZS5yZWFzb24pIHtcclxuICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBtZXNzYWdlIGZvcm1hdDonLCBtZXNzYWdlKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFZhbGlkYXRlIHN0YXR1cyB2YWx1ZSAtIG9ubHkgXCJQYXNzXCIgb3IgXCJSZWplY3RcIiBhcmUgYWxsb3dlZFxyXG4gICAgY29uc3Qgc3RhdHVzID0gbWVzc2FnZS51cGRhdGUuc3RhdHVzO1xyXG4gICAgaWYgKHN0YXR1cyAhPT0gJ1Bhc3MnICYmIHN0YXR1cyAhPT0gJ1JlamVjdCcpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihgSW52YWxpZCBzdGF0dXMgdmFsdWU6ICR7c3RhdHVzfS4gTXVzdCBiZSAnUGFzcycgb3IgJ1JlamVjdCdgKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKGBVcGRhdGluZyBzdGF0dXMgZm9yIGltYWdlICR7bWVzc2FnZS5pZH0gdG8gJHtzdGF0dXN9YCk7XHJcbiAgICBcclxuICAgIC8vIFVwZGF0ZSBpbWFnZSByZWNvcmQgaW4gRHluYW1vREJcclxuICAgIGNvbnN0IHVwZGF0ZVBhcmFtcyA9IHtcclxuICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5JTUFHRV9UQUJMRSxcclxuICAgICAgS2V5OiB7IGlkOiBtZXNzYWdlLmlkIH0sXHJcbiAgICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgI3N0YXR1cyA9IDpzdGF0dXMsICNyZWFzb24gPSA6cmVhc29uLCAjdXBkYXRlZEF0ID0gOnVwZGF0ZWRBdCcsXHJcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczoge1xyXG4gICAgICAgICcjc3RhdHVzJzogJ3N0YXR1cycsXHJcbiAgICAgICAgJyNyZWFzb24nOiAncmVhc29uJyxcclxuICAgICAgICAnI3VwZGF0ZWRBdCc6ICd1cGRhdGVkQXQnXHJcbiAgICAgIH0sXHJcbiAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcclxuICAgICAgICAnOnN0YXR1cyc6IHN0YXR1cyxcclxuICAgICAgICAnOnJlYXNvbic6IG1lc3NhZ2UudXBkYXRlLnJlYXNvbixcclxuICAgICAgICAnOnVwZGF0ZWRBdCc6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICB9LFxyXG4gICAgICBSZXR1cm5WYWx1ZXM6ICdBTExfTkVXJyBhcyBjb25zdFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZG9jQ2xpZW50LnNlbmQobmV3IFVwZGF0ZUNvbW1hbmQodXBkYXRlUGFyYW1zKSk7XHJcbiAgICBjb25zb2xlLmxvZygnSW1hZ2Ugc3RhdHVzIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5OicsIHJlc3VsdC5BdHRyaWJ1dGVzKTtcclxuICAgIFxyXG4gICAgLy8gUHVibGlzaCBtZXNzYWdlIHRvIHN0YXR1cyBub3RpZmljYXRpb24gdG9waWNcclxuICAgIGlmIChwcm9jZXNzLmVudi5TVEFUVVNfTk9USUZJQ0FUSU9OX1RPUElDKSB7XHJcbiAgICAgIGF3YWl0IHNuc0NsaWVudC5zZW5kKG5ldyBQdWJsaXNoQ29tbWFuZCh7XHJcbiAgICAgICAgVG9waWNBcm46IHByb2Nlc3MuZW52LlNUQVRVU19OT1RJRklDQVRJT05fVE9QSUMsXHJcbiAgICAgICAgTWVzc2FnZTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgaW1hZ2VJZDogbWVzc2FnZS5pZCxcclxuICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxyXG4gICAgICAgICAgcmVhc29uOiBtZXNzYWdlLnVwZGF0ZS5yZWFzb24sXHJcbiAgICAgICAgICBkYXRlOiBtZXNzYWdlLmRhdGUsXHJcbiAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIE1lc3NhZ2VBdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgICAnbWVzc2FnZV90eXBlJzoge1xyXG4gICAgICAgICAgICBEYXRhVHlwZTogJ1N0cmluZycsXHJcbiAgICAgICAgICAgIFN0cmluZ1ZhbHVlOiAnU3RhdHVzVXBkYXRlJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpO1xyXG4gICAgICBcclxuICAgICAgY29uc29sZS5sb2coYFN0YXR1cyBub3RpZmljYXRpb24gcHVibGlzaGVkIGZvciBpbWFnZSAke21lc3NhZ2UuaWR9YCk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3Npbmcgc3RhdHVzIHVwZGF0ZTonLCBlcnJvcik7XHJcbiAgICB0aHJvdyBlcnJvcjtcclxuICB9XHJcbn0gIl19