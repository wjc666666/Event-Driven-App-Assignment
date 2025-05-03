## Distributed Systems - Event-Driven Architecture

__Name:__ Juncheng Wang

__Demo__: https://youtu.be/HnYfMg6etVk

This repository implements a photo gallery management system using AWS services and Event-Driven Architecture. The application is deployed on AWS using CDK for infrastructure provisioning.

![](./images/arch.png)

### Features

__Photographer Features:__
  + Log new Images
  - Upload images to S3 bucket
  - Automatic metadata extraction
  - Initial status set to "pending"
  + Metadata updating
  - Update image details (title, description, tags)
  - Version tracking for changes
  + Invalid image removal  
  - Automatic cleanup of rejected images
  - S3 bucket cleanup
  + Status Update Mailer
  - Email notifications for status changes
  - Includes image details and moderator feedback

__Moderator Features:__
  + Status updating
  - Review and update image status
  - Add feedback comments
  - Trigger email notifications

### Event Flow

1. Image Upload → S3 → Lambda (logNewImage)
2. Metadata Update → SNS → Lambda (updateMetadata)
3. Status Update → SNS → Lambda (updateStatus)
4. Invalid Image → SNS → Lambda (removeInvalidImage)
5. Status Change → SNS → Lambda (sendStatusUpdateEmail)

### Project Structure

```
.
├── lambda/           # Lambda function handlers (TypeScript)
│   ├── logNewImage.ts
│   ├── addMetadata.ts
│   ├── updateStatus.ts
│   ├── updateImageStatus.ts
│   ├── removeImage.ts
│   ├── statusUpdateMailer.ts
│   ├── getPhotographerImages.ts
│   ├── logImage.ts
│   └── utils/        # Shared utility functions
├── images/           # Sample images and architecture diagram
├── lib/              # CDK infrastructure code
└── bin/              # CDK app entry point
```

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure AWS credentials:
   ```bash
   aws configure
   ```

3. Deploy the stack:
   ```bash
   cdk deploy
   ```

### Technical Details

- All Lambda functions are implemented in TypeScript using AWS SDK v3
- SNS message filtering ensures events are routed to appropriate handlers
- DynamoDB table stores image metadata and review status
- SES is used for email notifications to photographers
- Error handling and logging implemented across all functions
- TypeScript interfaces for type safety and better development experience

## Sending Messages via AWS CLI

### Adding Image Metadata

Photographers can add metadata to their images using the AWS CLI to publish messages to the SNS topic. Here's an example:

```bash
aws sns publish --topic-arn "TOPIC_ARN" --message-attributes file://examples/metadata_attributes.json --message file://examples/metadata_message.json
```

The message body should identify the image and contain the metadata value:

```json
{
  "id": "image1.jpeg",
  "value": "Olympic 100m final - 2024"
}
```

The message attributes specify the type of metadata:

```json
{
  "metadata_type": {
    "DataType": "String",
    "StringValue": "Caption"
  }
}
```

Valid metadata types are:
- Caption
- Date
- name (Photographer's name)

### Updating Image Status (Moderators)

Moderators can update the status of an image by publishing messages to the same SNS topic:

```bash
aws sns publish --topic-arn "TOPIC_ARN" --message file://examples/status_update_message.json
```

The message body should contain the image ID, date, and the status update:

```json
{
  "id": "image1.jpeg",
  "date": "01/05/2025",
  "update": {
    "status": "Pass",
    "reason": "Image quality meets standards"
  }
}
```

Valid status values are:
- Pass
- Reject

When an image status is updated, the system automatically sends an email notification to the photographer.

## Using the Interactive Script

We've included an interactive script that makes it easier to send messages to the SNS topic without having to manually create JSON files. To use it:

1. Edit the `examples/send_message.sh` script and update the `TOPIC_ARN` variable with your actual SNS topic ARN
2. Make the script executable:
   ```bash
   chmod +x examples/send_message.sh
   ```
3. Run the script:
   ```bash
   ./examples/send_message.sh
   ```

The script provides a menu-driven interface for:
- Adding a caption to an image
- Adding a date to an image
- Adding a photographer name to an image
- Updating an image's status (as a moderator)
