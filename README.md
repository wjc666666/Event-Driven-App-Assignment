## Distributed Systems - Event-Driven Architecture

__Name:__ Juncheng Wang

__Demo__: [URL of YouTube demo]

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
