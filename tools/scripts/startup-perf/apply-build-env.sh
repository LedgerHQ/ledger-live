#!/usr/bin/env bash
# Startup-perf spike: patch the checked-out ref for one build mode, before `pnpm mobile e2e:build`.
# Run from the repo root, after "Point swap requests at prod".
#
#   apply-build-env.sh <prod-like|no-bridge|e2e> [app_dir]
#
# Every mode also logs a "JS start epoch <ms>" startup event (see the end of this script).
#
# e2e        MOCK=1 and DETOX=1, the bridge runs on every launch.
# no-bridge  MOCK=1 and DETOX=1, but launches without wsPort (measured ones) leave init() before
#            the network logging and the socket.
# prod-like  MOCK and DETOX are off at build time; the bridge starts only on a launch that passes
#            wsPort (the injection), 20 s after the store is ready; the iOS blur is the real one.
#
# Every edit needs its anchor exactly once and exits non-zero (::error::) otherwise, leaving the
# file untouched. The edited lines carry "startup-perf", so a patched checkout can be recognised.
# POSIX awk only (BWK awk on macOS, mawk or gawk on Linux): ENVIRON, index(), ==, arrays.
set -euo pipefail

mode="${1:?usage: apply-build-env.sh <prod-like|no-bridge|e2e> [app_dir]}"
app="${2:-apps/ledger-live-mobile}"
# Must exceed the slowest measured startup plus the settle time; inject() waits 180 s for the app.
delay_ms="${STARTUP_PERF_BRIDGE_DELAY_MS:-20000}"

fail() {
  echo "::error::startup-perf build_env=$mode: $*" >&2
  exit 1
}
summary() {
  echo "$*"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "- $*" >> "$GITHUB_STEP_SUMMARY"; fi
}
# Number of lines of $1 exactly equal to $LINE.
count_exact() {
  awk 'BEGIN { t = ENVIRON["LINE"]; n = 0 } $0 == t { n++ } END { print n }' "$1"
}
# Runs awk program $1 on file $2 into a temp file; replaces $2 only when awk exits 0.
awk_in_place() {
  local prog="$1" file="$2" status=0
  awk "$prog" "$file" > "$file.startup-perf" || status=$?
  if [ "$status" -ne 0 ]; then
    rm -f "$file.startup-perf"
    return "$status"
  fi
  mv "$file.startup-perf" "$file"
}

case "$delay_ms" in '' | *[!0-9]*) fail "STARTUP_PERF_BRIDGE_DELAY_MS must be a number of ms" ;; esac
[ -d "$app" ] || fail "no app directory $app"
env_file="$app/.env.mock.prerelease"
index_file="$app/src/index.tsx"
rspack_file="$app/rspack.config.mjs"
client_file="$app/src/e2e/bridge/client.ts"
# Only the files the mode edits, so e2e still builds refs from before Re.Pack (no rspack config).
case "$mode" in
  e2e) needed="" ;;
  no-bridge) needed="$client_file" ;;
  prod-like) needed="$env_file $index_file $rspack_file $client_file" ;;
  *) fail "unknown build_env '$mode' (prod-like | no-bridge | e2e)" ;;
esac
for f in $needed; do
  [ -f "$f" ] || fail "$f not found"
done
if grep -qs 'startup-perf' "$index_file" "$client_file" "$rspack_file" \
  "$app/src/mvvm/utils/logStartup/beforeJSImports.ts"; then
  fail "a startup-perf patch is already applied: one mode per checkout"
fi

skip_bridge_in_client() {
  local guard='  if (!LaunchArguments.value()["wsPort"]) return; // startup-perf: measured launch, no bridge'
  # Before the network logging (from July 2026); before the socket on refs without it.
  local anchor='^  if [(]ws[)] [{]$'
  if grep -q 'initAppNetworkLogging' "$client_file"; then anchor='^  initAppNetworkLogging[(][)];$'; fi
  GUARD="$guard" ANCHOR="$anchor" awk_in_place '
    BEGIN { guard = ENVIRON["GUARD"]; anchor = ENVIRON["ANCHOR"] }
    /^export function init[(][)] [{]/ { in_init = 1 }
    in_init && !done && $0 ~ anchor { print guard; done = 1 }
    /^}/ { in_init = 0 }
    { print }
    END { exit done ? 0 : 3 }
  ' "$client_file" || fail "no line matching $anchor in init() of $client_file"
  grep -n -B2 'startup-perf: measured launch' "$client_file"
}

prod_like_env() {
  local line n
  for line in 'MOCK=1' 'DETOX=1'; do
    n=$(LINE="$line" count_exact "$env_file")
    [ "$n" = 1 ] || fail "expected one '$line' line in $env_file, found $n"
  done
  # MOCK and DETOX, plus the test-only keys no store env file has. Only key names are printed:
  # the file also holds API keys.
  awk '/^(MOCK|DETOX|MOCK_COUNTERVALUES|DISABLE_YELLOW_BOX|FEATURE_FLAGS|SIMCTL_CHILD_[A-Za-z0-9_]*)=/ {
         i = index($0, "="); print "  removed " substr($0, 1, i - 1) > "/dev/stderr"; next }
       { print }' "$env_file" > "$env_file.startup-perf"
  mv "$env_file.startup-perf" "$env_file"
  if grep -Eq '^[[:space:]]*(export[[:space:]]+)?(MOCK|DETOX|MOCK_COUNTERVALUES)[[:space:]]*=' "$env_file"; then
    fail "$env_file still sets MOCK, DETOX or MOCK_COUNTERVALUES"
  fi
  n=$(LINE='FORCE_DEBUG_VISIBLE=1' count_exact "$env_file")
  [ "$n" = 1 ] || fail "expected one 'FORCE_DEBUG_VISIBLE=1' in $env_file (the Maestro read needs it), found $n"
  if grep -q '^SWAP_API_BASE=' "$env_file"; then
    grep -qx 'SWAP_API_BASE="https://swap.ledger.com/v5"' "$env_file" ||
      fail "SWAP_API_BASE is not the prod URL: run the swap rewrite first"
  fi
}

prod_like_index() {
  # onInitFinished is the same 5 lines on develop and at the August 2026 refs.
  IMPORT_INIT='import { init } from "~/e2e/bridge/client";' \
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

prod_like_rspack() {
  # Every spike build has ENVFILE=.../.env.mock.prerelease, which aliases the blur library to the
  # E2E passthrough View. Keep the alias only for an explicit DETOX=1 bundling shell.
  local old='const isDetoxBuild = process.env.DETOX === "1" || (process.env.ENVFILE || "").includes("mock");'
  local new='const isDetoxBuild = process.env.DETOX === "1"; // startup-perf prod-like: no blur mock'
  local n
  n=$(LINE="$old" count_exact "$rspack_file")
  [ "$n" = 1 ] || fail "expected one isDetoxBuild line in $rspack_file, found $n"
  OLD="$old" NEW="$new" awk_in_place \
    'BEGIN { o = ENVIRON["OLD"]; r = ENVIRON["NEW"] } $0 == o { print r; next } { print }' \
    "$rspack_file" || fail "cannot rewrite isDetoxBuild in $rspack_file"
  grep -n 'isDetoxBuild =' "$rspack_file"
}

case "$mode" in
  e2e)
    summary "build_env=e2e: MOCK=1, DETOX=1, the E2E bridge runs on every launch"
    ;;
  no-bridge)
    skip_bridge_in_client
    summary "build_env=no-bridge: MOCK=1, DETOX=1, measured launches leave the bridge's init() early"
    ;;
  prod-like)
    # Edit nothing until every anchor is known to be there.
    [ "$(LINE='const isDetoxBuild = process.env.DETOX === "1" || (process.env.ENVFILE || "").includes("mock");' count_exact "$rspack_file")" = 1 ] ||
      fail "isDetoxBuild anchor missing in $rspack_file"
    [ "$(LINE='import { init } from "~/e2e/bridge/client";' count_exact "$index_file")" = 1 ] ||
      fail "bridge import anchor missing in $index_file"
    for line in 'MOCK=1' 'DETOX=1' 'FORCE_DEBUG_VISIBLE=1'; do
      [ "$(LINE="$line" count_exact "$env_file")" = 1 ] || fail "expected one '$line' line in $env_file"
    done
    if grep -q '^SWAP_API_BASE=' "$env_file"; then
      grep -qx 'SWAP_API_BASE="https://swap.ledger.com/v5"' "$env_file" ||
        fail "SWAP_API_BASE is not the prod URL: run the swap rewrite first"
    fi
    if [ "$(uname -s)" = Darwin ] && [ -e /tmp/envfile ]; then
      fail "/tmp/envfile exists: react-native-config would read it instead of ENVFILE"
    fi
    prod_like_index
    prod_like_rspack
    prod_like_env
    summary "build_env=prod-like: no MOCK/DETOX in the env file, bridge on wsPort only after ${delay_ms} ms, real blur"
    ;;
  *)
    fail "unknown build_env '$mode' (prod-like | no-bridge | e2e)"
    ;;
esac

# Every mode: a startup event named after the wall clock of the JS start, which lets the harness add
# the native start (process start → JS start) that the Debug value leaves out since 2026-10-26.
# Measurement only, so a missing anchor is a warning.
js_start_file="$app/src/mvvm/utils/logStartup/beforeJSImports.ts"
js_start_line='logStartupEvent("Before js imports");'
if [ -f "$js_start_file" ] && [ "$(LINE="$js_start_line" count_exact "$js_start_file")" = 1 ]; then
  LINE="$js_start_line" awk_in_place '
    BEGIN { t = ENVIRON["LINE"] }
    $0 == t {
      print "const startupPerfJsStart = logStartupEvent(\"Before js imports\");"
      print "logStartupEvent(`JS start epoch ${startupPerfJsStart.time}`); // startup-perf: JS start wall clock"
      next
    }
    { print }
  ' "$js_start_file"
  summary "build_env=$mode: startup events include \"JS start epoch <ms>\""
else
  echo "::warning::startup-perf: no '$js_start_line' in $js_start_file: no JS start epoch, native start not measured"
fi
