#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EventDrivenAppAssignmentStack } from '../lib/event-driven-app-stack';

const app = new cdk.App();
new EventDrivenAppAssignmentStack(app, 'EventDrivenAppAssignmentStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  }
}); 