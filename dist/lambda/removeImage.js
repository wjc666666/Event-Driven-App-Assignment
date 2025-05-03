"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3 = new client_s3_1.S3Client({});
const handler = async (event) => {
    try {
        for (const record of event.Records) {
            await processRecord(record);
        }
        return { statusCode: 200, body: 'Remove Image Lambda executed successfully.' };
    }
    catch (error) {
        console.error('Error processing SQS event:', error);
        throw error;
    }
};
exports.handler = handler;
async function processRecord(record) {
    var _a, _b;
    try {
        const message = JSON.parse(record.body);
        const s3Info = (_b = (_a = message.Records) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.s3;
        if (!s3Info) {
            console.warn('No S3 information found in message');
            return;
        }
        const bucket = s3Info.bucket.name;
        const key = s3Info.object.key;
        console.log(`Attempting to delete invalid file: ${key} from bucket: ${bucket}`);
        await s3.send(new client_s3_1.DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        }));
        console.log(`Successfully deleted invalid file: ${key}`);
    }
    catch (error) {
        console.error('Error processing record:', error);
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlSW1hZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9sYW1iZGEvcmVtb3ZlSW1hZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW1FO0FBR25FLE1BQU0sRUFBRSxHQUFHLElBQUksb0JBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQWVyQixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBZSxFQUFpRCxFQUFFO0lBQzVGLElBQUk7UUFDQSxLQUFLLE1BQU0sTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDaEMsTUFBTSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDL0I7UUFDRCxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsNENBQTRDLEVBQUUsQ0FBQztLQUNsRjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwRCxNQUFNLEtBQUssQ0FBQztLQUNmO0FBQ0wsQ0FBQyxDQUFDO0FBVlcsUUFBQSxPQUFPLFdBVWxCO0FBRUYsS0FBSyxVQUFVLGFBQWEsQ0FBQyxNQUFpQjs7SUFDMUMsSUFBSTtRQUNBLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBWSxDQUFDO1FBQ25ELE1BQU0sTUFBTSxHQUFHLE1BQUEsTUFBQSxPQUFPLENBQUMsT0FBTywwQ0FBRyxDQUFDLENBQUMsMENBQUUsRUFBRSxDQUFDO1FBRXhDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDVCxPQUFPLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFDbkQsT0FBTztTQUNWO1FBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDbEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFFOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsR0FBRyxpQkFBaUIsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUVoRixNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSwrQkFBbUIsQ0FBQztZQUNsQyxNQUFNLEVBQUUsTUFBTTtZQUNkLEdBQUcsRUFBRSxHQUFHO1NBQ1gsQ0FBQyxDQUFDLENBQUM7UUFFSixPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0tBQzVEO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pELE1BQU0sS0FBSyxDQUFDO0tBQ2Y7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUzNDbGllbnQsIERlbGV0ZU9iamVjdENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtczMnO1xyXG5pbXBvcnQgeyBTUVNFdmVudCwgU1FTUmVjb3JkIH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcblxyXG5jb25zdCBzMyA9IG5ldyBTM0NsaWVudCh7fSk7XHJcblxyXG5pbnRlcmZhY2UgUzNFdmVudCB7XHJcbiAgICBSZWNvcmRzOiBBcnJheTx7XHJcbiAgICAgICAgczM6IHtcclxuICAgICAgICAgICAgYnVja2V0OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIG9iamVjdDoge1xyXG4gICAgICAgICAgICAgICAga2V5OiBzdHJpbmc7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgIH0+O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogU1FTRXZlbnQpOiBQcm9taXNlPHsgc3RhdHVzQ29kZTogbnVtYmVyOyBib2R5OiBzdHJpbmcgfT4gPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiBldmVudC5SZWNvcmRzKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHByb2Nlc3NSZWNvcmQocmVjb3JkKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBib2R5OiAnUmVtb3ZlIEltYWdlIExhbWJkYSBleGVjdXRlZCBzdWNjZXNzZnVsbHkuJyB9O1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIFNRUyBldmVudDonLCBlcnJvcik7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbn07XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzUmVjb3JkKHJlY29yZDogU1FTUmVjb3JkKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKHJlY29yZC5ib2R5KSBhcyBTM0V2ZW50O1xyXG4gICAgICAgIGNvbnN0IHMzSW5mbyA9IG1lc3NhZ2UuUmVjb3Jkcz8uWzBdPy5zMztcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXMzSW5mbykge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIFMzIGluZm9ybWF0aW9uIGZvdW5kIGluIG1lc3NhZ2UnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYnVja2V0ID0gczNJbmZvLmJ1Y2tldC5uYW1lO1xyXG4gICAgICAgIGNvbnN0IGtleSA9IHMzSW5mby5vYmplY3Qua2V5O1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGluZyB0byBkZWxldGUgaW52YWxpZCBmaWxlOiAke2tleX0gZnJvbSBidWNrZXQ6ICR7YnVja2V0fWApO1xyXG5cclxuICAgICAgICBhd2FpdCBzMy5zZW5kKG5ldyBEZWxldGVPYmplY3RDb21tYW5kKHtcclxuICAgICAgICAgICAgQnVja2V0OiBidWNrZXQsXHJcbiAgICAgICAgICAgIEtleToga2V5XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgU3VjY2Vzc2Z1bGx5IGRlbGV0ZWQgaW52YWxpZCBmaWxlOiAke2tleX1gKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyByZWNvcmQ6JywgZXJyb3IpO1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG59ICJdfQ==