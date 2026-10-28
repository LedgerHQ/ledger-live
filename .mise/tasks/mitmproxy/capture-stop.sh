#!/usr/bin/env bash

set -euo pipefail

#MISE description="Stop the mitmdump started by mitmproxy:capture-start, print its per-key summary and expose it to later steps."
#MISE raw=true

#USAGE flag "--pid [pid]" env="FIREBASE_CAPTURE_PID" default="" help="PID of the mitmdump started by mitmproxy:capture-start"

LOG_DIR="${RUNNER_TEMP:-${HOME}/.mitmproxy/logs}"
LOG_FILE="${LOG_DIR}/firebase-capture.log"
SUMMARY_FILE="${LOG_DIR}/firebase-capture-summary.json"

# Disable colors when not in a terminal or when NO_COLOR is set (e.g. CI log parsers)
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
	_CYAN="\033[0;36m" _GREEN="\033[0;32m" _RESET="\033[0m"
else
	_CYAN="" _GREEN="" _RESET=""
fi

log_info() { echo -e "${_CYAN}[INFO]${_RESET} ${*}"; }
log_success() { echo -e "${_GREEN}[SUCCESS]${_RESET} ${*}"; }

write_output() {
	if [ -n "${GITHUB_OUTPUT:-}" ]; then
		echo "${1}" >>"${GITHUB_OUTPUT}"
	fi
}

if [ -z "${usage_pid}" ] || ! kill -0 "${usage_pid}" 2>/dev/null; then
	log_info "Remote Config capture proxy was not running"
	write_output "status=off"
	exit 0
fi

# SIGINT lets the addon write its summary on shutdown.
kill -INT "${usage_pid}"
for _ in $(seq 1 30); do
	kill -0 "${usage_pid}" 2>/dev/null || break
	sleep 1
done
kill -KILL "${usage_pid}" 2>/dev/null || true
log_success "Remote Config capture proxy stopped"
write_output "status=on"

grep -F "[firebase_capture]" "${LOG_FILE}" || true

if [ ! -f "${SUMMARY_FILE}" ]; then
	log_info "No summary was written, see ${LOG_FILE}"
	exit 0
fi

python3 - "${SUMMARY_FILE}" <<'EOF'
import json, os, re, sys

with open(sys.argv[1]) as f:
    summary = json.load(f)
rows = []
for key, stats in summary.items():
    project = re.search(r"/projects/([^/]+)/", key)
    language = re.search(r"language_code=(\S*)", key)
    rows.append({"project": project.group(1) if project else key, "language": language.group(1) if language else "", **stats})

lines = [
    "### Remote Config capture proxy",
    "",
    "| Firebase project | Language | Upstream | Replayed | Timed out | Failed | Template version |",
    "| --- | --- | --: | --: | --: | --: | --- |",
    *(
        f"| {r['project']} | {r['language']} | {r['upstream']} | {r['replayed']} | {r['timedOut']} | {r['failed']} | {r['templateVersion'] or 'none'} |"
        for r in rows
    ),
]
print("\n".join(lines))
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f:
        f.write("\n".join(lines) + "\n")
if os.environ.get("GITHUB_OUTPUT"):
    templates = " ".join(f"{r['project']}@{r['templateVersion'] or 'none'}" for r in rows)
    with open(os.environ["GITHUB_OUTPUT"], "a") as f:
        f.write(f"templates={templates}\n")
        f.write(f"upstream={sum(r['upstream'] for r in rows)}\n")
        f.write(f"replayed={sum(r['replayed'] for r in rows)}\n")
EOF
