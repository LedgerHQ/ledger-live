#!/bin/bash
set +e  # Don't exit on error, we handle errors ourselves

# Script to validate all changeset files in .changeset/ directory
# This validates format and package existence without comparing to base branch

echo "🔍 Validating all changeset files..."

ERRORS=0
VALID_COUNT=0

# Get all package names from the workspace
echo "📦 Collecting package names from workspace..."
PACKAGE_NAMES=$(pnpm ls -r --depth=-1 --json 2>/dev/null | jq -r '.[] | select(.name != null) | .name' | sort -u)

if [ -z "$PACKAGE_NAMES" ]; then
  echo "⚠️  Warning: Could not collect package names. Package existence checks will be skipped."
  SKIP_PACKAGE_CHECK=true
  exit 1
else
  SKIP_PACKAGE_CHECK=false
  PACKAGE_COUNT=$(echo "$PACKAGE_NAMES" | wc -l | tr -d ' ')
  echo "   Found $PACKAGE_COUNT packages"
fi

# Function to check if package exists
package_exists() {
  local package_name="$1"
  if [ "$SKIP_PACKAGE_CHECK" = "true" ]; then
    return 0  # Skip check if we couldn't collect packages
  fi
  echo "$PACKAGE_NAMES" | grep -qFx "$package_name"
}

# Function to validate a changeset file
validate_changeset() {
  local file="$1"
  local errors=0
  
  # Check if file exists and is readable
  if [ ! -f "$file" ] || [ ! -r "$file" ]; then
    echo "❌ $file: File not found or not readable"
    return 1
  fi
  
  # Check if file has YAML frontmatter
  if ! head -1 "$file" | grep -q "^---$"; then
    echo "❌ $file: Missing YAML frontmatter (---)"
    return 1
  fi
  
  # Extract YAML section (lines between first two ---, excluding the --- lines themselves)
  YAML_SECTION=$(awk '/^---$/{if(++count==2)exit} count==1 && !/^---$/' "$file")
  
  if [ -z "$YAML_SECTION" ]; then
    echo "❌ $file: Missing or invalid YAML section"
    return 1
  fi
  
  # Validate each package entry
  while IFS= read -r line; do
    # Skip empty lines
    [ -z "$line" ] && continue
    
    # Trim whitespace
    line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "$line" ] && continue
    
    # Check format: "package-name": patch|minor|major
    if ! echo "$line" | grep -qE '^"[^"]+":\s*(patch|minor|major)$'; then
      echo "❌ $file: Invalid format in line: $line"
      errors=$((errors + 1))
      continue
    fi
    
    # Extract package name and version type using awk (more reliable)
    # Format is: "package-name": version-type
    PACKAGE_NAME=$(echo "$line" | awk -F': ' '{gsub(/"/, "", $1); print $1}')
    VERSION_TYPE=$(echo "$line" | awk -F': ' '{print $2}' | tr -d '[:space:]')
    
    # Validate version type
    if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
      echo "❌ $file: Invalid version type '$VERSION_TYPE' for package '$PACKAGE_NAME' (must be patch, minor, or major)"
      errors=$((errors + 1))
      continue
    fi
    
    # Validate package exists
    if ! package_exists "$PACKAGE_NAME"; then
      echo "❌ $file: Package '$PACKAGE_NAME' not found in workspace"
      errors=$((errors + 1))
    fi
  done <<< "$YAML_SECTION"
  
  # Check if there's content after YAML (optional, just a warning)
  # Note: Warnings don't affect the return code, only errors do
  CONTENT_AFTER=$(awk '/^---$/{if(++count==2){getline; if(NR==FNR)next}} count>=2' "$file" | sed '/^$/d' | head -1)
  if [ -z "$CONTENT_AFTER" ]; then
    echo "⚠️  $file: No description/content after YAML frontmatter" >&2
  fi
  
  # Return non-zero if there are errors
  if [ $errors -gt 0 ]; then
    return 1
  else
    return 0
  fi
}

# Validate all .md files in .changeset/ (except config.json)
for file in .changeset/*.md; do
  if [ -f "$file" ]; then
    # Capture validation output (both stdout and stderr)
    VALIDATION_OUTPUT=$(validate_changeset "$file" 2>&1)
    VALIDATION_EXIT=$?
    
    if [ $VALIDATION_EXIT -eq 0 ]; then
      # File is valid (no errors)
      VALID_COUNT=$((VALID_COUNT + 1))
      # Don't show output for valid files
    else
      # File has errors - show them
      ERRORS=$((ERRORS + 1))
      echo "$VALIDATION_OUTPUT"
    fi
  fi
done

echo ""
echo "📊 Summary:"
echo "  Valid: $VALID_COUNT"
echo "  Errors: $ERRORS"

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Validation failed with $ERRORS error(s)"
  exit 1
else
  echo ""
  echo "✅ All changesets are valid!"
  exit 0
fi

