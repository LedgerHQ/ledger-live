#!/bin/bash

# Merge E2E timing files script
# This script merges shard timing files and handles null/invalid files gracefully

set -e

# Default values
PLATFORM="android"
ARTIFACTS_DIR="."
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --artifacts-dir)
      ARTIFACTS_DIR="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --platform PLATFORM     Platform (ios or android, default: android)"
      echo "  --artifacts-dir DIR     Artifacts directory (default: current directory)"
      echo "  --verbose, -v           Enable verbose output"
      echo "  --help, -h              Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Log function
log() {
  if [ "$VERBOSE" = true ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  else
    echo "$1"
  fi
}

log "Starting merge timing files for platform: $PLATFORM"
log "Artifacts directory: $ARTIFACTS_DIR"

# Set up file paths
pattern="e2e-test-results-$PLATFORM-shard-*.json"
existing_file="$ARTIFACTS_DIR/e2e-test-results-$PLATFORM.json"
output_file="./e2e-test-results-$PLATFORM.json"

# Check if shard files exist
if ! compgen -G "$pattern" > /dev/null; then
  log "No timing files found for pattern $pattern, skipping merge."
  if [ -f "$existing_file" ]; then
    log "Keeping existing cached timing file"
    cp "$existing_file" "$output_file"
  else
    log "Creating empty timing file"
    echo '{}' > "$output_file"
  fi
  exit 0
fi

# List all shard files found
shard_files=($pattern)
log "Found ${#shard_files[@]} shard files: ${shard_files[*]}"

# Validate and filter files
valid_files=()
invalid_files=()

for file in "${shard_files[@]}"; do
  log "Validating file: $file"
  
  # Check if file exists and is not empty
  if [ ! -s "$file" ]; then
    log "  ✗ File is empty or doesn't exist: $file"
    invalid_files+=("$file")
    continue
  fi
  
  # Check if file contains valid JSON
  if ! jq empty "$file" 2>/dev/null; then
    log "  ✗ Invalid JSON in file: $file"
    invalid_files+=("$file")
    continue
  fi
  
  # Check if file is a JSON object (not null, array, string, etc.)
  json_type=$(jq -r 'type' "$file" 2>/dev/null)
  if [ "$json_type" != "object" ]; then
    log "  ✗ File is not a JSON object (type: $json_type): $file"
    invalid_files+=("$file")
    continue
  fi
  
  # Check if file has testResults field
  if ! jq -e '.testResults' "$file" >/dev/null 2>&1; then
    log "  ⚠ File missing testResults field: $file"
    # Still consider it valid but warn
  fi
  
  log "  ✓ Valid file: $file"
  valid_files+=("$file")
done

log "Valid files: ${#valid_files[@]}"
if [ ${#invalid_files[@]} -gt 0 ]; then
  log "Invalid files that will be skipped: ${invalid_files[*]}"
fi

# Perform merge based on whether existing file exists
if [ -f "$existing_file" ]; then
  log "Found existing cached timing file, performing incremental merge..."
  
  if [ ${#valid_files[@]} -gt 0 ]; then
    log "Merging ${#valid_files[@]} valid files with existing cache..."
    
    # Incremental merge with existing file
    jq -s '
      # Get existing and new test results with null checks
      (.[0].testResults // []) as $existing |
      # Filter out null testResults and add valid ones
      ([.[1:][] | select(.testResults != null) | .testResults] | add // []) as $new |
      # Create a map of existing tests by name for easy lookup
      ($existing | map({key: .name, value: .}) | from_entries) as $existingMap |
      # Create a map of new tests by name
      ($new | map({key: .name, value: .}) | from_entries) as $newMap |
      # Merge maps: new tests override existing ones
      ($existingMap + $newMap) as $mergedMap |
      # Convert back to array and merge with other fields
      .[0] * {
        testResults: ($mergedMap | to_entries | map(.value)),
        numFailedTestSuites: ([.[] | select(.numFailedTestSuites != null) | .numFailedTestSuites] | add // 0),
        numFailedTests: ([.[] | select(.numFailedTests != null) | .numFailedTests] | add // 0),
        numPassedTestSuites: ([.[] | select(.numPassedTestSuites != null) | .numPassedTestSuites] | add // 0),
        numPassedTests: ([.[] | select(.numPassedTests != null) | .numPassedTests] | add // 0),
        numPendingTestSuites: ([.[] | select(.numPendingTestSuites != null) | .numPendingTestSuites] | add // 0),
        numPendingTests: ([.[] | select(.numPendingTests != null) | .numPendingTests] | add // 0),
        numTotalTestSuites: ([.[] | select(.numTotalTestSuites != null) | .numTotalTestSuites] | add // 0),
        numTotalTests: ([.[] | select(.numTotalTests != null) | .numTotalTests] | add // 0)
      }
    ' "$existing_file" "${valid_files[@]}" > "$output_file"
    
    log "Incrementally merged timing files with existing cache"
  else
    log "No valid shard files found, keeping existing cache"
    cp "$existing_file" "$output_file"
  fi
else
  log "No existing cached timing file found, performing fresh merge..."
  
  if [ ${#valid_files[@]} -gt 0 ]; then
    log "Merging ${#valid_files[@]} valid files..."
    
    # Fresh merge of shard files only
    jq -s '.[0] * {
      testResults: ([.[] | select(.testResults != null) | .testResults] | add // []),
      numFailedTestSuites: ([.[] | select(.numFailedTestSuites != null) | .numFailedTestSuites] | add // 0),
      numFailedTests: ([.[] | select(.numFailedTests != null) | .numFailedTests] | add // 0),
      numPassedTestSuites: ([.[] | select(.numPassedTestSuites != null) | .numPassedTestSuites] | add // 0),
      numPassedTests: ([.[] | select(.numPassedTests != null) | .numPassedTests] | add // 0),
      numPendingTestSuites: ([.[] | select(.numPendingTestSuites != null) | .numPendingTestSuites] | add // 0),
      numPendingTests: ([.[] | select(.numPendingTests != null) | .numPendingTests] | add // 0),
      numTotalTestSuites: ([.[] | select(.numTotalTestSuites != null) | .numTotalTestSuites] | add // 0),
      numTotalTests: ([.[] | select(.numTotalTests != null) | .numTotalTests] | add // 0)
    }' "${valid_files[@]}" > "$output_file"
    
    log "Fresh merge of timing files"
  else
    log "No valid shard files found, creating empty timing file"
    echo '{"testResults": [], "numFailedTestSuites": 0, "numFailedTests": 0, "numPassedTestSuites": 0, "numPassedTests": 0, "numPendingTestSuites": 0, "numPendingTests": 0, "numTotalTestSuites": 0, "numTotalTests": 0, "success": true}' > "$output_file"
  fi
fi

# Show summary
if [ -f "$output_file" ]; then
  log "=== Merge Summary ==="
  log "Output file: $output_file"
  log "File size: $(wc -c < "$output_file") bytes"
  log "Number of test results: $(jq '.testResults | length' "$output_file")"
  log "Total tests: $(jq '.numTotalTests' "$output_file")"
  log "Passed tests: $(jq '.numPassedTests' "$output_file")"
  log "Failed tests: $(jq '.numFailedTests' "$output_file")"
  log "Success: $(jq '.success' "$output_file")"
fi

log "Merge timing files completed successfully!" 