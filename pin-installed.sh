#!/bin/bash

# File containing the paths to package.json files
PACKAGE_JSON_PATHS="./package-json-paths.txt"

# Fields to process
FIELDS=("dependencies" "devDependencies" "optionalDependencies")

# Loop through each package.json file listed in the input file
while read -r PACKAGE_JSON; do
  # Navigate to the directory containing the package.json
  PACKAGE_DIR=$(dirname "$PACKAGE_JSON")
  PACKAGE_FILE=$(basename "$PACKAGE_JSON")
  echo ""
  echo "*** Processing $PACKAGE_JSON ***"

  # Loop through each field (dependencies, devDependencies, etc.)
  for FIELD in "${FIELDS[@]}"; do
    # Check if the field exists and is not null in the package.json file
    FIELD_EXISTS=$(jq -r "has(\"${FIELD}\")" "$PACKAGE_JSON")
    if [[ "$FIELD_EXISTS" == "true" ]]; then
      DEPENDENCIES=$(jq -r ".${FIELD} | keys[]" "$PACKAGE_JSON")
      if [[ -n "$DEPENDENCIES" ]]; then
        # Loop through each dependency in the field
        for DEP in $DEPENDENCIES; do
          # Skip workspace dependencies (usually indicated with *)
          CURRENT_VERSION=$(jq -r ".${FIELD}[\"$DEP\"]" "$PACKAGE_JSON")
            if [[ "$CURRENT_VERSION" == workspace:* ]]; then
            continue
          fi

          # Change directory to the package directory and get the installed version
          pushd "$PACKAGE_DIR" > /dev/null
          # Retrieve the installed version of the dependency
            INSTALLED_VERSION=$(pnpm list "$DEP" --depth 0 --json | jq -r '.[0].dependencies["'$DEP'"].version // .[0].devDependencies["'$DEP'"].version')

          # Update the package.json with the installed version inline
          jq ".${FIELD}[\"$DEP\"] = \"$INSTALLED_VERSION\"" "$PACKAGE_FILE" | sponge "$PACKAGE_FILE"
          echo "${FIELD} Updated $DEP to $INSTALLED_VERSION"

          popd > /dev/null
        done
      fi
    else
      echo "(Field ${FIELD} does not exist)"
    fi
  done
done < "$PACKAGE_JSON_PATHS"

echo "Dependency pinning completed."
