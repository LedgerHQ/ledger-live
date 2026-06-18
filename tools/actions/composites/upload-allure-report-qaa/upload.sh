#!/usr/bin/env bash
# Upload an allure-results directory to the qaa-allure portal (Allure 3).
# The directory contents are zipped into a single `allure-results.zip`
# (the server transparently extracts it before running the Allure CLI).
#
# Required env:
#   QAA_ALLURE_API_KEY  — API key sent as `x-api-key`
#   QAA_ALLURE_PATH     — path to the allure-results directory
#   QAA_ALLURE_NAME     — human-readable run name
#
# Optional env:
#   QAA_ALLURE_HOST     — server base URL (default: https://allure-new.aws.sbx.ldg-tech.com).
#                          Overriding is intended for local testing only; the composite
#                          action does not expose it as an input.
#   QAA_ALLURE_TAGS     — JSON array of tag strings, e.g. '["desktop","smoke"]'
#   QAA_ALLURE_HISTORY  — historyLevel, 1–200 (default: 50)
#   QAA_ALLURE_JOB_URL  — when set, sent as multipart `jobUrl` so the portal can
#                         deep-link back to the CI run that produced the report
#   GITHUB_OUTPUT       — when set, writes report_id / report_url / view_url
#
# Exits 0 with a warning when the API key is empty or the path has no files,
# so the composite stays safe to run before the secret is provisioned.

set -euo pipefail

: "${QAA_ALLURE_PATH:?QAA_ALLURE_PATH is required}"
: "${QAA_ALLURE_NAME:?QAA_ALLURE_NAME is required}"
QAA_ALLURE_API_KEY="${QAA_ALLURE_API_KEY:-}"
QAA_ALLURE_HOST="${QAA_ALLURE_HOST:-https://allure-new.aws.sbx.ldg-tech.com}"
QAA_ALLURE_TAGS="${QAA_ALLURE_TAGS:-}"
QAA_ALLURE_HISTORY="${QAA_ALLURE_HISTORY:-50}"
QAA_ALLURE_JOB_URL="${QAA_ALLURE_JOB_URL:-}"

warn() { echo "::warning title=qaa-allure::$*"; }
fail() { echo "::error title=qaa-allure::$*"; exit 1; }

# Neutralize control characters and `::` so untrusted data (server responses,
# rejected ids, etc.) can't inject GitHub Actions workflow commands when echoed
# to the job log.
sanitize_for_log() { printf '%s' "$1" | tr '\n\r\t' '   ' | sed 's/::/[colon][colon]/g'; }

if [ -z "${QAA_ALLURE_API_KEY}" ]; then
  warn "QAA_ALLURE_API_KEY is empty — skipping upload (experimental)"
  exit 0
fi
if [ ! -d "${QAA_ALLURE_PATH}" ]; then
  warn "path '${QAA_ALLURE_PATH}' not found — skipping upload"
  exit 0
fi

file_count=$(find "${QAA_ALLURE_PATH}" -type f | wc -l | tr -d ' ')
if [ "${file_count}" -eq 0 ]; then
  warn "path '${QAA_ALLURE_PATH}' has no files — skipping upload"
  exit 0
fi

command -v zip >/dev/null || fail "'zip' is required but not installed"
command -v jq  >/dev/null || fail "'jq' is required but not installed"

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/qaa-allure-upload.XXXXXX")
trap 'rm -rf "${tmp_dir}"' EXIT
zip_path="${tmp_dir}/allure-results.zip"

# Zip *contents* of the directory (entries relative to it) so the server
# extracts files directly into its results dir, not into a nested folder.
(cd "${QAA_ALLURE_PATH}" && zip -r -q "${zip_path}" .)
zip_size=$(wc -c < "${zip_path}" | tr -d ' ')
# An empty zip (just an EOCD record) is 22 bytes. Anything that small means
# zip silently dropped every entry (permissions, broken symlinks, etc.); don't
# bother POSTing it.
if [ "${zip_size}" -le 22 ]; then
  fail "produced zip is empty or truncated (${zip_size} bytes); expected ${file_count} files from ${QAA_ALLURE_PATH}"
fi
echo "Zipped ${file_count} files from ${QAA_ALLURE_PATH} → ${zip_path} (${zip_size} bytes)"

# Pass the API key via a curl config file rather than `-H "x-api-key: …"` so
# the key never appears in the curl process command line / /proc listing.
curl_config="${tmp_dir}/curl.conf"
(umask 077 && printf 'header = "x-api-key: %s"\n' "${QAA_ALLURE_API_KEY}" > "${curl_config}")

curl_args=(
  --silent --show-error --fail-with-body
  --connect-timeout 30 --max-time 600
  --retry 3 --retry-connrefused --retry-delay 5
  --config "${curl_config}"
  -X POST "${QAA_ALLURE_HOST}/api/v1/reports"
  --form-string "name=${QAA_ALLURE_NAME}"
  --form-string "historyLevel=${QAA_ALLURE_HISTORY}"
  -F "files=@${zip_path}"
)
if [ -n "${QAA_ALLURE_TAGS}" ]; then
  curl_args+=(--form-string "tags=${QAA_ALLURE_TAGS}")
fi
if [ -n "${QAA_ALLURE_JOB_URL}" ]; then
  curl_args+=(--form-string "jobUrl=${QAA_ALLURE_JOB_URL}")
fi

# Capture body + exit code separately so we can log the body when curl fails
# (under `set -e` a non-zero exit aborts before we'd otherwise print it).
set +e
response=$(curl "${curl_args[@]}")
curl_exit=$?
set -e
if [ "${curl_exit}" -ne 0 ]; then
  echo "qaa-allure curl failed (exit ${curl_exit}); response body follows:"
  echo "  $(sanitize_for_log "${response}")"
  fail "curl exited ${curl_exit}"
fi

report_id=$(jq -r '.data.id // empty' <<<"${response}" 2>/dev/null || true)
if [ -z "${report_id}" ]; then
  echo "qaa-allure response was not the expected shape; raw body:"
  echo "  $(sanitize_for_log "${response}")"
  fail "Upload succeeded but no report id was returned"
fi
# Validate before interpolating into GITHUB_OUTPUT / ::notice so a hostile or
# malformed response can't inject workflow commands via newlines or `::`.
if ! [[ "${report_id}" =~ ^[A-Za-z0-9_-]{1,128}$ ]]; then
  fail "rejected report_id (unexpected characters): $(sanitize_for_log "${report_id}")"
fi

status=$(jq -r '.data.status // "unknown"' <<<"${response}" 2>/dev/null || echo "unknown")
echo "qaa-allure upload accepted: id=${report_id} status=$(sanitize_for_log "${status}")"

report_url="${QAA_ALLURE_HOST}/reports/${report_id}"
view_url="${QAA_ALLURE_HOST}/api/v1/reports/${report_id}/view"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "report_id=${report_id}"
    echo "report_url=${report_url}"
    echo "view_url=${view_url}"
  } >> "${GITHUB_OUTPUT}"
fi

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  echo "[Open report](${report_url})" >> "${GITHUB_STEP_SUMMARY}"
fi
