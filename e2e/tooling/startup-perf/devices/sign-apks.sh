#!/usr/bin/env bash
# Signs <dir>/app.apk with the staging key as <dir>/signed.apk, for each <dir> that has one, and
# prints "<dir>: <commit>" for it. Usage: sign-apks.sh <dir>...
set -euo pipefail
: "${ANDROID_HOME:?}" "${KS_PATH:?}" "${KS_PASS:?}"

bt="$ANDROID_HOME/build-tools/36.0.0"
for dir in "$@"; do
  [[ -f "$dir/app.apk" ]] || continue
  "$bt/zipalign" -f -p 4 "$dir/app.apk" "$dir/aligned.apk" >&2
  # shellcheck disable=SC2086
  "$bt/apksigner" sign --v4-signing-enabled false --ks "$KS_PATH" --ks-pass $KS_PASS --ks-key-alias staging --key-pass $KS_PASS --out "$dir/signed.apk" "$dir/aligned.apk" >&2
  echo "$dir: $(cat "$dir/sha.txt")"
done
