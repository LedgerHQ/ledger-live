#!/bin/bash
set -euo pipefail

# Upload Allure results to frankescobar/allure-docker-service and generate a report.
# Sets the report URL as a GitHub Actions step output (report-url) via $GITHUB_OUTPUT.
#
# Required environment variables:
#   ALLURE_SERVER_URL  - Base URL of the Allure Docker Service
#   ALLURE_LOGIN       - Basic auth username
#   ALLURE_PASSWORD    - Basic auth password
#   PROJECT_ID         - Allure project identifier
#   RESULTS_DIR        - Path to the allure results directory
#   BUILD_URL          - CI build URL (shown in executor info)
#   BUILD_NAME         - CI build name (shown in executor info)
#
# Optional environment variables:
#   OUTPUT_FILE        - File to write "report-url=<url>" (defaults to $GITHUB_OUTPUT)

if [ -z "${RESULTS_DIR:-}" ]; then
  echo "::error::RESULTS_DIR is not set"
  exit 1
fi

if [ ! -d "$RESULTS_DIR" ]; then
  echo "::error::Results directory '$RESULTS_DIR' not found"
  exit 1
fi

for var in ALLURE_SERVER_URL ALLURE_LOGIN ALLURE_PASSWORD PROJECT_ID RESULTS_DIR BUILD_URL BUILD_NAME; do
  if [ -z "${!var:-}" ]; then
    echo "::error::Required environment variable $var is not set"
    exit 1
  fi
done

COOKIE_JAR=$(mktemp)
RESPONSE_BODY=$(mktemp)
trap 'rm -f "$COOKIE_JAR" "$RESPONSE_BODY"' EXIT

API="$ALLURE_SERVER_URL/allure-docker-service"

# Tokens populated after /login. CSRF_TOKEN is auto-injected by http_call.
CSRF_TOKEN=""
CSRF_REFRESH_TOKEN=""

# Curl networking bounds — prevents CI jobs from hanging on a wedged connection.
CONNECT_TIMEOUT=15
MAX_TIME=600

# Read both CSRF tokens out of the cookie jar (Netscape format: 7 tab-separated
# fields; column 6 is cookie name, column 7 is value).
extract_csrf_tokens() {
  CSRF_TOKEN=$(awk '$6=="csrf_access_token"{print $7}' "$COOKIE_JAR")
  CSRF_REFRESH_TOKEN=$(awk '$6=="csrf_refresh_token"{print $7}' "$COOKIE_JAR")
}

# Swap the expired access token for a fresh one using the refresh cookie.
# Allure access tokens expire in 15 min by default; a long batch upload can
# cross that boundary and start getting 401s mid-run.
refresh_access_token() {
  echo "Access token expired; requesting refresh..." >&2
  local code
  code=$(curl -sS \
    --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -o "$RESPONSE_BODY" -w "%{http_code}" \
    -X POST "$API/refresh" \
    -H "X-CSRF-TOKEN: $CSRF_REFRESH_TOKEN" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR") || code="curl-error"
  if [[ "$code" != 2?? ]]; then
    echo "::error::token refresh failed (HTTP $code)" >&2
    cat "$RESPONSE_BODY" >&2
    return 1
  fi
  extract_csrf_tokens
  echo "Token refresh successful" >&2
}

# ── helper: wraps curl with cookie jar, CSRF header, timeouts, and 401-retry ──
# Usage: http_call "<label>" <curl-args...>
# - Auto-adds -b/-c "$COOKIE_JAR" and (once CSRF_TOKEN is set) X-CSRF-TOKEN.
# - On 401 with a refresh token available, calls /refresh and retries once.
# - On non-2xx: emits a ::error:: annotation with the response body, returns 1.
# - On success: echoes the response body to stdout.
http_call() {
  local label="$1"; shift
  local -a call_args=("$@")
  local attempt=0 max_attempts=2
  local code

  while [ "$attempt" -lt "$max_attempts" ]; do
    attempt=$((attempt + 1))
    local -a opts=(
      -sS
      --connect-timeout "$CONNECT_TIMEOUT"
      --max-time "$MAX_TIME"
      -o "$RESPONSE_BODY"
      -w "%{http_code}"
      -b "$COOKIE_JAR"
      -c "$COOKIE_JAR"
    )
    if [ -n "$CSRF_TOKEN" ]; then
      opts+=(-H "X-CSRF-TOKEN: $CSRF_TOKEN")
    fi
    code=$(curl "${opts[@]}" "${call_args[@]}") || code="curl-error"

    if [[ "$code" == "401" && -n "$CSRF_REFRESH_TOKEN" && "$attempt" -lt "$max_attempts" ]]; then
      echo "::warning::$label got 401; attempting token refresh" >&2
      refresh_access_token || break
      continue
    fi
    break
  done

  if [[ "$code" != 2?? ]]; then
    echo "::error::$label failed (HTTP $code)" >&2
    echo "--- response body ---" >&2
    cat "$RESPONSE_BODY" >&2
    echo "" >&2
    echo "--- end body ---" >&2
    return 1
  fi
  cat "$RESPONSE_BODY"
}

# Sanitize PROJECT_ID: replace invalid URL path characters and
# lowercase it — allure-docker-service only accepts [a-z0-9_-].
PROJECT_ID="${PROJECT_ID//\//-}"
PROJECT_ID=$(printf '%s' "$PROJECT_ID" | tr '[:upper:]' '[:lower:]')

# ── Step 1: Authenticate and obtain JWT + CSRF tokens ──
echo "Authenticating to Allure server..."
LOGIN_PAYLOAD=$(jq -n --arg u "$ALLURE_LOGIN" --arg p "$ALLURE_PASSWORD" \
  '{username: $u, password: $p}')
http_call "login" -X POST "$API/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD" > /dev/null

extract_csrf_tokens
if [ -z "$CSRF_TOKEN" ] || [ -z "$CSRF_REFRESH_TOKEN" ]; then
  echo "::error::Failed to extract CSRF tokens from login response"
  exit 1
fi
echo "Authentication successful"

# ── Step 2: Prepare URL-safe identifiers ──
ENCODED_PROJECT_ID=$(printf '%s' "$PROJECT_ID" | jq -sRr @uri)
ENCODED_BUILD_NAME=$(printf '%s' "$BUILD_NAME" | jq -sRr @uri)
ENCODED_BUILD_URL=$(printf '%s' "$BUILD_URL" | jq -sRr @uri)

# ── Step 3: Flatten subdirectories ──
# The allure-docker-service stores files flat. Mobile results use an
# attachments/ subdirectory, so we move files to the root and update
# the source references in result JSONs before uploading.
SUBDIRS=()
while IFS= read -r -d '' dir; do
  SUBDIRS+=("$dir")
done < <(find "$RESULTS_DIR" -mindepth 1 -type d -print0)

if [ ${#SUBDIRS[@]} -gt 0 ]; then
  echo "Flattening ${#SUBDIRS[@]} subdirectory(ies)..."
  for dir in "${SUBDIRS[@]}"; do
    prefix="${dir#"$RESULTS_DIR"/}"
    # Move files to root
    find "$dir" -maxdepth 1 -type f -exec mv {} "$RESULTS_DIR/" \;
    # Update attachment references in result JSONs: "attachments/uuid.png" → "uuid.png"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i "" "s|${prefix}/||g" "$RESULTS_DIR"/*-result.json 2>/dev/null || true
    else
      sed -i "s|${prefix}/||g" "$RESULTS_DIR"/*-result.json 2>/dev/null || true
    fi
    rmdir "$dir" 2>/dev/null || true
  done
fi

# ── Step 4: Upload result files in batches ──
# The server rejects payloads that are too large (413), so we upload
# in batches of 500 files. Results accumulate until generate-report.
# force_project_creation=true auto-creates the project on first upload,
# replacing the explicit POST /projects call. Requires allure-docker-service
# >= 2.13.6.
BATCH_SIZE=500
ALL_FILES=()
while IFS= read -r -d '' file; do
  ALL_FILES+=("$file")
done < <(find "$RESULTS_DIR" -maxdepth 1 -type f -print0)

TOTAL=${#ALL_FILES[@]}
if [ "$TOTAL" -eq 0 ]; then
  echo "::error::No files found in $RESULTS_DIR"
  exit 1
fi
echo "Uploading $TOTAL files to project: $PROJECT_ID (batch size: $BATCH_SIZE)"

for ((i = 0; i < TOTAL; i += BATCH_SIZE)); do
  BATCH=("${ALL_FILES[@]:i:BATCH_SIZE}")
  CURL_FILES=()
  for file in "${BATCH[@]}"; do
    CURL_FILES+=(-F "files[]=@$file")
  done

  BATCH_NUM=$(( i / BATCH_SIZE + 1 ))
  BATCH_END=$(( i + ${#BATCH[@]} ))
  echo "  Batch $BATCH_NUM: files $((i + 1))-$BATCH_END of $TOTAL"

  http_call "send-results batch $BATCH_NUM" \
    -X POST "$API/send-results?project_id=$ENCODED_PROJECT_ID&force_project_creation=true" \
    "${CURL_FILES[@]}" > /dev/null
done
echo "Upload complete"
echo ""

# ── Step 5: Generate the report (with executor info for CI link) ──
echo "Generating report for project: $PROJECT_ID"
GENERATE_URL="$API/generate-report?project_id=$ENCODED_PROJECT_ID"
GENERATE_URL+="&execution_name=$ENCODED_BUILD_NAME"
GENERATE_URL+="&execution_from=$ENCODED_BUILD_URL"
GENERATE_URL+="&execution_type=github"

GENERATE_RESPONSE=$(http_call "generate-report" -X GET "$GENERATE_URL")
echo ""

# Extract report URL from server response; fall back to latest if missing
SERVER_REPORT_URL=$(echo "$GENERATE_RESPONSE" | jq -r '.data.report_url // empty')
if [ -n "$SERVER_REPORT_URL" ]; then
  # Replace http with https; keep the specific report number for a permanent URL
  REPORT_URL=$(echo "$SERVER_REPORT_URL" | sed 's|^http://|https://|')
else
  REPORT_URL="$API/projects/$ENCODED_PROJECT_ID/reports/latest/index.html"
fi
echo "========================================================================"
echo "REPORT URL: $REPORT_URL"
echo "========================================================================"

# Write report URL to output file (GitHub Actions output or custom file)
OUT="${OUTPUT_FILE:-${GITHUB_OUTPUT:-}}"
if [ -n "$OUT" ]; then
  echo "report-url=$REPORT_URL" >> "$OUT"
fi
