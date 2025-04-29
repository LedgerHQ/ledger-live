#!/bin/bash

# Check if testExecutionKey is provided as an argument
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path>"
    exit 1
fi

# Assignation des arguments
XRAY_PATH="$1"

# Check if the provided path exists
if [ ! -d "$XRAY_PATH" ]; then
    echo "The path $XRAY_PATH doesn't exist"
    exit 1
fi

cd "$XRAY_PATH" || exit 1

# Initialize an empty array for storing test results
aggregated_tests=()

# Iterate through downloaded results files
for file in xray-reports-*/xray-*.json; do
  # Check if the file exists
  if [ -f "$file" ]; then
    # Extract testExecutionKey and tests from the file
    test_execution_key=$(jq -r '.testExecutionKey' "$file")
    tests=$(jq -c '.tests[]' "$file")

    # Set the TEST_EXECUTION_KEY if not already set
    [ -z "$TEST_EXECUTION_KEY" ] && export TEST_EXECUTION_KEY=$test_execution_key

    # Append tests to the aggregated array
    aggregated_tests+=($tests)
  fi
done

# Create the final Xray payload
xray_payload='{"testExecutionKey":"'$TEST_EXECUTION_KEY'","info":{},"tests":['
xray_payload+=$(IFS=,; echo "${aggregated_tests[*]}")
xray_payload+=']}'

# Print the content of the aggregated Xray payload
echo "Xray Payload Content:"
echo "$xray_payload"

# Output the aggregated Xray payload to a file
echo "$xray_payload" > aggregated-xray-reports.json