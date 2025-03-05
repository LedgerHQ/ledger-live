# Script to format the Allure test results into a single JSON file for Xray export
#!/bin/bash

# Check if testExecutionKey is provided as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <path> <platform> <testExecutionKey>"
    exit 1
fi

# Assign the provided arguments
path="$1"
platform=$(echo "$2" | tr '[:lower:]' '[:upper:]')
testExecutionKey="$3"
info="{}"

if [[ -z "$testExecutionKey" ]]; then
    info="{\"summary\":\"[$platform] Speculos test execution\",
    \"description\":\"This execution is automatically created when importing execution results from an external source\"}"
fi

# Initialize the result structure
combined_json="{\"testExecutionKey\":\"$testExecutionKey\",\"info\":$info,\"tests\":[]}"

# Temporary file to store the combined JSON
temp_file=$(mktemp)

# Create the initial structure in the temporary file
echo $combined_json > "$temp_file"

# Arrays to track testKeys and their statuses
testKeys=()
statuses=()
timestamps=()

# Process each JSON file in the specified directory
for file in "$path"/*-result.json; do
    # Extract test keys (split by comma), status, and start timestamp
    testKeysRaw=$(jq -r '.links[].name // empty' "$file" | tr ',' '\n')
    status=$(jq -r '.status | ascii_upcase' "$file")
    start=$(jq -r '.start // 0' "$file")  # Default to 0 if missing

    # Replace 'BROKEN' status with 'FAILED'
    if [ "$status" == "BROKEN" ]; then
        status="FAILED"
    fi

    # Process each test key separately
    while IFS= read -r testKey; do
        testKey=$(echo "$testKey" | xargs) # Trim whitespace

        # Check if testKey is not empty
        if [[ -n "$testKey" ]]; then
            found=false
            for i in "${!testKeys[@]}"; do
                if [ "${testKeys[$i]}" == "$testKey" ]; then
                    # Update status only if the new start timestamp is more recent
                    if [ "$start" -gt "${timestamps[$i]}" ]; then
                        statuses[$i]="$status"
                        timestamps[$i]="$start"
                    fi
                    found=true
                    break
                fi
            done

            # If testKey not found, add it
            if [ "$found" == false ]; then
                testKeys+=("$testKey")
                statuses+=("$status")
                timestamps+=("$start")
            fi
        fi
    done <<< "$testKeysRaw"
done

# Add the collected test entries to the combined JSON
for i in "${!testKeys[@]}"; do
    test_entry="{\"testKey\":\"${testKeys[$i]}\",\"status\":\"${statuses[$i]}\"}"
    jq --argjson entry "$test_entry" '.tests += [$entry]' "$temp_file" > tmp && mv tmp "$temp_file"
done

# Save the combined JSON to a final output file
output_file="$path/xray_report.json"
jq '.' "$temp_file" > "$output_file"

# Clean up the temporary file
rm "$temp_file"

echo "Xray JSON file created: $output_file"