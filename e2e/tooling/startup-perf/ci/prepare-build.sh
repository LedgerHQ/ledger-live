#!/usr/bin/env bash
# Makes the checked-out ref's E2E prerelease build prod-like, before `pnpm mobile e2e:build`.
# Run from the repo root: prepare-build.sh [app_dir]. See README.md.
# POSIX awk only (BWK awk on macOS, mawk or gawk on Linux).
set -euo pipefail

app="${1:-apps/ledger-live-mobile}"
# Above the slowest startup plus the settle time, below inject()'s 180 s wait for the app.
delay_ms="${STARTUP_PERF_BRIDGE_DELAY_MS:-20000}"
swap_api_base='SWAP_API_BASE="https://swap.ledger.com/v5"'

fail() {
  echo "::error::startup-perf prepare-build: $*" >&2
  exit 1
}
summary() {
  echo "$*"
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then echo "- $*" >> "$GITHUB_STEP_SUMMARY"; fi
}
count_exact() {
  local file="$1"
  awk 'BEGIN { t = ENVIRON["LINE"]; n = 0 } $0 == t { n++ } END { print n }' "$file"
}
awk_in_place() {
  local prog="$1" file="$2" status=0
  awk "$prog" "$file" > "$file.startup-perf" || status=$?
  if [[ "$status" -ne 0 ]]; then
    rm -f "$file.startup-perf"
    return "$status"
  fi
  mv "$file.startup-perf" "$file"
}

case "$delay_ms" in
  '' | *[!0-9]*) fail "STARTUP_PERF_BRIDGE_DELAY_MS must be a number of ms" ;;
  *) ;;
esac
[[ -d "$app" ]] || fail "no app directory $app"
env_file="$app/.env.mock.prerelease"
index_file="$app/src/index.tsx"
rspack_file="$app/rspack.config.mjs"
package_file="$app/package.json"
js_start_file="$app/src/mvvm/utils/logStartup/beforeJSImports.ts"
rspack_line='const isDetoxBuild = process.env.DETOX === "1" || (process.env.ENVFILE || "").includes("mock");'
bridge_import='import { init } from "~/e2e/bridge/client";'
js_start_line='logStartupEvent("Before js imports");'

for f in "$env_file" "$index_file" "$rspack_file" "$package_file"; do
  [[ -f "$f" ]] || fail "$f not found"
done
if grep -qs 'startup-perf' "$index_file" "$rspack_file" "$js_start_file"; then
  fail "this checkout is already patched"
fi
[[ "$(LINE="$rspack_line" count_exact "$rspack_file")" == 1 ]] ||
  fail "isDetoxBuild anchor missing in $rspack_file"
[[ "$(LINE="$bridge_import" count_exact "$index_file")" == 1 ]] ||
  fail "bridge import anchor missing in $index_file"
for line in 'MOCK=1' 'DETOX=1' 'FORCE_DEBUG_VISIBLE=1'; do
  [[ "$(LINE="$line" count_exact "$env_file")" == 1 ]] || fail "expected one '$line' line in $env_file"
done
e2e_build_detox() {
  awk 'index($0, "\"e2e:build\":") && index($0, "DETOX=1 ") { n++ } END { print n + 0 }' \
    "$package_file"
}
case "$(e2e_build_detox)" in
  0 | 1) ;;
  *) fail "more than one e2e:build line sets DETOX=1 in $package_file" ;;
esac
if [[ "$(uname -s)" == Darwin && -e /tmp/envfile ]]; then
  fail "/tmp/envfile exists: react-native-config would read it instead of ENVFILE"
fi

gate_bridge_on_ws_port() {
  IMPORT_INIT="$bridge_import" \
  IMPORT_LA='import { LaunchArguments } from "react-native-launch-arguments";' \
  DELAY_MS="$delay_ms" awk_in_place '
    { line[NR] = $0 }
    END {
      imp = ENVIRON["IMPORT_INIT"]; la = ENVIRON["IMPORT_LA"]
      ni = 0; nb = 0; nla = 0; nother = 0
      for (i = 1; i <= NR; i++) {
        if (line[i] == imp) { ni++; ii = i }
        if (line[i] == la) nla++
        else if (index(line[i], "\"react-native-launch-arguments\"") > 0) nother++
        if (i + 4 <= NR && line[i] == "  onInitFinished = () => {" &&
            line[i + 1] == "    if (Config.DETOX) {" && line[i + 2] == "      init();" &&
            line[i + 3] == "    }" && line[i + 4] == "  };") { nb++; bi = i }
      }
      if (ni != 1 || nb != 1 || nother != 0) {
        printf "found %d bridge import(s), %d onInitFinished DETOX block(s), %d other launch-arguments import(s); expected 1, 1, 0\n", ni, nb, nother | "cat 1>&2"
        exit 3
      }
      for (i = 1; i <= NR; i++) {
        if (i == bi) {
          print line[i]
          print "    if (Config.DETOX) {"
          print "      init();"
          print "    } else {"
          print "      // startup-perf prod-like: the E2E bridge only on the injection launch (wsPort),"
          print "      // after the measured startup, so measured launches run no bridge code."
          print "      setTimeout(() => {"
          print "        if (LaunchArguments.value()[\"wsPort\"]) init();"
          print "      }, " ENVIRON["DELAY_MS"] ");"
          print "    }"
          print "  };"
          i += 4
          continue
        }
        print line[i]
        if (i == ii && nla == 0) print la
      }
    }
  ' "$index_file" || fail "cannot gate the bridge on wsPort in $index_file (anchors above)"
  grep -n 'react-native-launch-arguments\|~/e2e/bridge/client' "$index_file"
  grep -n -A11 '^  onInitFinished = () => {$' "$index_file"
}

real_blur() {
  # rspack aliases the blur to the E2E mock for any "mock" ENVFILE: keep that for DETOX=1 only.
  OLD="$rspack_line" NEW='const isDetoxBuild = process.env.DETOX === "1"; // startup-perf prod-like: no blur mock' \
    awk_in_place 'BEGIN { o = ENVIRON["OLD"]; r = ENVIRON["NEW"] } $0 == o { print r; next } { print }' \
    "$rspack_file" || fail "cannot rewrite isDetoxBuild in $rspack_file"
  grep -n 'isDetoxBuild =' "$rspack_file"
}

bundle_without_detox() {
  [[ "$(e2e_build_detox)" == 1 ]] || return 0
  awk_in_place '
    index($0, "\"e2e:build\":") && (i = index($0, "DETOX=1 ")) {
      $0 = substr($0, 1, i - 1) substr($0, i + 8)
    }
    { print }' "$package_file" || fail "cannot drop DETOX=1 from e2e:build in $package_file"
  [[ "$(e2e_build_detox)" == 0 ]] || fail "e2e:build still sets DETOX=1 in $package_file"
  grep -n '"e2e:build"' "$package_file"
  summary "e2e:build bundles without DETOX=1"
}

prod_like_env() {
  # Only key names are printed: the file also holds API keys.
  SWAP="$swap_api_base" awk '
    BEGIN { swap = ENVIRON["SWAP"] }
    /^(MOCK|DETOX|MOCK_COUNTERVALUES|DISABLE_YELLOW_BOX|FEATURE_FLAGS|SIMCTL_CHILD_[A-Za-z0-9_]*)=/ {
      i = index($0, "="); print "  removed " substr($0, 1, i - 1) > "/dev/stderr"; next }
    /^SWAP_API_BASE=/ { print swap; print "  SWAP_API_BASE set to prod" > "/dev/stderr"; next }
    { print }' "$env_file" > "$env_file.startup-perf"
  mv "$env_file.startup-perf" "$env_file"
  if grep -Eq '^[[:space:]]*(export[[:space:]]+)?(MOCK|DETOX|MOCK_COUNTERVALUES)[[:space:]]*=' "$env_file"; then
    fail "$env_file still sets MOCK, DETOX or MOCK_COUNTERVALUES"
  fi
}

# Older refs lack the anchor: a warning, as only the native start goes unmeasured.
log_js_start_epoch() {
  if [[ -f "$js_start_file" && "$(LINE="$js_start_line" count_exact "$js_start_file")" == 1 ]]; then
    LINE="$js_start_line" awk_in_place '
      BEGIN { t = ENVIRON["LINE"] }
      $0 == t {
        print "const startupPerfJsStart = logStartupEvent(\"Before js imports\");"
        print "logStartupEvent(`JS start epoch ${startupPerfJsStart.time}`); // startup-perf: JS start wall clock"
        next
      }
      { print }
    ' "$js_start_file"
    summary "startup events include \"JS start epoch <ms>\""
  else
    echo "::warning::startup-perf: no '$js_start_line' in $js_start_file: native start not measured"
  fi
}

gate_bridge_on_ws_port
real_blur
bundle_without_detox
prod_like_env
log_js_start_epoch
summary "prod-like build: no MOCK/DETOX in the env file, swap on prod, bridge on wsPort only after ${delay_ms} ms, real blur"
