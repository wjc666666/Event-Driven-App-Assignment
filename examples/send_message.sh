#!/bin/bash

# Replace with your actual SNS topic ARN
TOPIC_ARN="arn:aws:sns:us-east-1:123456789012:EventDrivenAppAssignmentStack-lower-image-events"

# Function to send metadata update
send_metadata() {
  echo "Sending metadata update for image: $1"
  echo "Metadata type: $2"
  echo "Value: $3"
  
  # Create temporary message file
  cat > /tmp/message.json << EOL
{
  "id": "$1",
  "value": "$3"
}
EOL

  # Create temporary attributes file
  cat > /tmp/attributes.json << EOL
{
  "metadata_type": {
    "DataType": "String",
    "StringValue": "$2"
  }
}
EOL

  # Send message to SNS topic
  aws sns publish \
    --topic-arn "$TOPIC_ARN" \
    --message file:///tmp/message.json \
    --message-attributes file:///tmp/attributes.json
  
  echo "Message sent."
}

# Function to send status update
send_status_update() {
  echo "Sending status update for image: $1"
  echo "Status: $2"
  echo "Reason: $3"
  
  # Create temporary message file
  cat > /tmp/status_message.json << EOL
{
  "id": "$1",
  "date": "$(date +%d/%m/%Y)",
  "update": {
    "status": "$2",
    "reason": "$3"
  }
}
EOL

  # Send message to SNS topic
  aws sns publish \
    --topic-arn "$TOPIC_ARN" \
    --message file:///tmp/status_message.json
  
  echo "Message sent."
}

# Display menu
show_menu() {
  echo "=== Image Management System ==="
  echo "1. Add Caption"
  echo "2. Add Date"
  echo "3. Add Photographer Name"
  echo "4. Update Image Status"
  echo "5. Exit"
  echo "Choose an option: "
}

# Main menu loop
while true; do
  show_menu
  read -r option
  
  case $option in
    1)
      read -p "Enter image ID: " image_id
      read -p "Enter caption: " caption
      send_metadata "$image_id" "Caption" "$caption"
      ;;
    2)
      read -p "Enter image ID: " image_id
      read -p "Enter date (DD/MM/YYYY): " date
      send_metadata "$image_id" "Date" "$date"
      ;;
    3)
      read -p "Enter image ID: " image_id
      read -p "Enter photographer name: " name
      send_metadata "$image_id" "name" "$name"
      ;;
    4)
      read -p "Enter image ID: " image_id
      read -p "Enter status (Pass/Reject): " status
      read -p "Enter reason: " reason
      send_status_update "$image_id" "$status" "$reason"
      ;;
    5)
      echo "Exiting."
      exit 0
      ;;
    *)
      echo "Invalid option. Please try again."
      ;;
  esac
  
  echo ""
  read -p "Press Enter to continue..."
  clear
done 