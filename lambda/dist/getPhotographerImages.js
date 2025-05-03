"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const handler = async (event) => {
    try {
        const photographerId = event.pathParameters?.photographerId;
        if (!photographerId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Photographer ID is required' })
            };
        }
        // Query DynamoDB for all images by this photographer
        const queryParams = {
            TableName: process.env.IMAGES_TABLE_NAME,
            IndexName: 'PhotographerIdIndex',
            KeyConditionExpression: 'photographerId = :photographerId',
            ExpressionAttributeValues: {
                ':photographerId': photographerId
            }
        };
        const result = await docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully retrieved photographer images',
                images: result.Items
            })
        };
    }
    catch (error) {
        console.error('Error retrieving photographer images:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0UGhvdG9ncmFwaGVySW1hZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vZ2V0UGhvdG9ncmFwaGVySW1hZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDhEQUEwRDtBQUMxRCx3REFBNkU7QUFHN0UsTUFBTSxZQUFZLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sU0FBUyxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUVyRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUN6RixJQUFJO1FBQ0EsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUM7UUFFNUQsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNqQixPQUFPO2dCQUNILFVBQVUsRUFBRSxHQUFHO2dCQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLDZCQUE2QixFQUFFLENBQUM7YUFDbkUsQ0FBQztTQUNMO1FBRUQscURBQXFEO1FBQ3JELE1BQU0sV0FBVyxHQUFHO1lBQ2hCLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFrQjtZQUN6QyxTQUFTLEVBQUUscUJBQXFCO1lBQ2hDLHNCQUFzQixFQUFFLGtDQUFrQztZQUMxRCx5QkFBeUIsRUFBRTtnQkFDdkIsaUJBQWlCLEVBQUUsY0FBYzthQUNwQztTQUNKLENBQUM7UUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSwyQkFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFbkUsT0FBTztZQUNILFVBQVUsRUFBRSxHQUFHO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ2pCLE9BQU8sRUFBRSw0Q0FBNEM7Z0JBQ3JELE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSzthQUN2QixDQUFDO1NBQ0wsQ0FBQztLQUNMO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlELE9BQU87WUFDSCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLHVCQUF1QixFQUFFLENBQUM7U0FDN0QsQ0FBQztLQUNMO0FBQ0wsQ0FBQyxDQUFDO0FBckNXLFFBQUEsT0FBTyxXQXFDbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XHJcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFF1ZXJ5Q29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYic7XHJcbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcclxuXHJcbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XHJcbmNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShkeW5hbW9DbGllbnQpO1xyXG5cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcGhvdG9ncmFwaGVySWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8ucGhvdG9ncmFwaGVySWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFwaG90b2dyYXBoZXJJZCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxyXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnUGhvdG9ncmFwaGVyIElEIGlzIHJlcXVpcmVkJyB9KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUXVlcnkgRHluYW1vREIgZm9yIGFsbCBpbWFnZXMgYnkgdGhpcyBwaG90b2dyYXBoZXJcclxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IHtcclxuICAgICAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5JTUFHRVNfVEFCTEVfTkFNRSEsXHJcbiAgICAgICAgICAgIEluZGV4TmFtZTogJ1Bob3RvZ3JhcGhlcklkSW5kZXgnLCAvLyBZb3UnbGwgbmVlZCB0byBjcmVhdGUgdGhpcyBHU0lcclxuICAgICAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ3Bob3RvZ3JhcGhlcklkID0gOnBob3RvZ3JhcGhlcklkJyxcclxuICAgICAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xyXG4gICAgICAgICAgICAgICAgJzpwaG90b2dyYXBoZXJJZCc6IHBob3RvZ3JhcGhlcklkXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChuZXcgUXVlcnlDb21tYW5kKHF1ZXJ5UGFyYW1zKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1N1Y2Nlc3NmdWxseSByZXRyaWV2ZWQgcGhvdG9ncmFwaGVyIGltYWdlcycsXHJcbiAgICAgICAgICAgICAgICBpbWFnZXM6IHJlc3VsdC5JdGVtc1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH07XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJldHJpZXZpbmcgcGhvdG9ncmFwaGVyIGltYWdlczonLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufTsgIl19