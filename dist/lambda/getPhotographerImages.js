"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const handler = async (event) => {
    var _a;
    try {
        const photographerId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.photographerId;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0UGhvdG9ncmFwaGVySW1hZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGFtYmRhL2dldFBob3RvZ3JhcGhlckltYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQTZFO0FBRzdFLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFckQsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7O0lBQ3pGLElBQUk7UUFDQSxNQUFNLGNBQWMsR0FBRyxNQUFBLEtBQUssQ0FBQyxjQUFjLDBDQUFFLGNBQWMsQ0FBQztRQUU1RCxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ2pCLE9BQU87Z0JBQ0gsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsNkJBQTZCLEVBQUUsQ0FBQzthQUNuRSxDQUFDO1NBQ0w7UUFFRCxxREFBcUQ7UUFDckQsTUFBTSxXQUFXLEdBQUc7WUFDaEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWtCO1lBQ3pDLFNBQVMsRUFBRSxxQkFBcUI7WUFDaEMsc0JBQXNCLEVBQUUsa0NBQWtDO1lBQzFELHlCQUF5QixFQUFFO2dCQUN2QixpQkFBaUIsRUFBRSxjQUFjO2FBQ3BDO1NBQ0osQ0FBQztRQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLDJCQUFZLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUVuRSxPQUFPO1lBQ0gsVUFBVSxFQUFFLEdBQUc7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDakIsT0FBTyxFQUFFLDRDQUE0QztnQkFDckQsTUFBTSxFQUFFLE1BQU0sQ0FBQyxLQUFLO2FBQ3ZCLENBQUM7U0FDTCxDQUFDO0tBQ0w7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUQsT0FBTztZQUNILFVBQVUsRUFBRSxHQUFHO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQztTQUM3RCxDQUFDO0tBQ0w7QUFDTCxDQUFDLENBQUM7QUFyQ1csUUFBQSxPQUFPLFdBcUNsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcclxuaW1wb3J0IHsgRHluYW1vREJEb2N1bWVudENsaWVudCwgUXVlcnlDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcclxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xyXG5cclxuY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcclxuY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGR5bmFtb0NsaWVudCk7XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwaG90b2dyYXBoZXJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5waG90b2dyYXBoZXJJZDtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXBob3RvZ3JhcGhlcklkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXHJcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6ICdQaG90b2dyYXBoZXIgSUQgaXMgcmVxdWlyZWQnIH0pXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBRdWVyeSBEeW5hbW9EQiBmb3IgYWxsIGltYWdlcyBieSB0aGlzIHBob3RvZ3JhcGhlclxyXG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0ge1xyXG4gICAgICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3MuZW52LklNQUdFU19UQUJMRV9OQU1FISxcclxuICAgICAgICAgICAgSW5kZXhOYW1lOiAnUGhvdG9ncmFwaGVySWRJbmRleCcsIC8vIFlvdSdsbCBuZWVkIHRvIGNyZWF0ZSB0aGlzIEdTSVxyXG4gICAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAncGhvdG9ncmFwaGVySWQgPSA6cGhvdG9ncmFwaGVySWQnLFxyXG4gICAgICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XHJcbiAgICAgICAgICAgICAgICAnOnBob3RvZ3JhcGhlcklkJzogcGhvdG9ncmFwaGVySWRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBRdWVyeUNvbW1hbmQocXVlcnlQYXJhbXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnU3VjY2Vzc2Z1bGx5IHJldHJpZXZlZCBwaG90b2dyYXBoZXIgaW1hZ2VzJyxcclxuICAgICAgICAgICAgICAgIGltYWdlczogcmVzdWx0Lkl0ZW1zXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmV0cmlldmluZyBwaG90b2dyYXBoZXIgaW1hZ2VzOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSlcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59OyAiXX0=