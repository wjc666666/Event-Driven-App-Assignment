## Distributed Systems - Event-Driven Architecture

__Name:__ Juncheng Wang

__Demo__: [URL of YouTube demo]

This repository implements a photo gallery management system using AWS services and Event-Driven Architecture. The application is deployed on AWS using CDK for infrastructure provisioning.

![](./images/arch.png)

### Code Status

__Feature:__
+ Photographer:
  + Log new Images - Completed & Tested
  + Metadata updating - Completed & Tested
  + Invalid image removal - Completed & Tested
  + Status Update Mailer - Completed & Tested
+ Moderator:
  + Status updating - Completed & Tested

### Project Structure

```
.
├── lambda/           # Lambda function handlers (TypeScript)
├── images/           # Sample images and architecture diagram
├── lib/              # CDK infrastructure code
└── bin/              # CDK app entry point
```

### Notes

- All Lambda functions are implemented in TypeScript using AWS SDK v3
- SNS message filtering ensures events are routed to appropriate handlers
- DynamoDB table stores image metadata and review status
- SES is used for email notifications to photographers
