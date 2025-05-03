#!/bin/bash

# SNS Topic ARN from deployment output
TOPIC_ARN="arn:aws:sns:us-east-1:122610498830:eventdrivenappassignmentstack-image-events"

# Test 1: Add Metadata
echo "Test 1: Sending metadata update message..."
aws sns publish \
  --topic-arn "$TOPIC_ARN" \
  --message file://test_messages/message.json \
  --message-attributes file://test_messages/attributes.json \
  --region us-east-1

echo ""
echo "Waiting 5 seconds..."
sleep 5

# Test 2: Update Status
echo "Test 2: Sending status update message..."
aws sns publish \
  --topic-arn "$TOPIC_ARN" \
  --message file://test_messages/status_message.json \
  --region us-east-1

echo ""
echo "All test messages have been sent!" 