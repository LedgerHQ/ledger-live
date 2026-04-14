#!/usr/bin/env bash
# Patch AVD config.ini to lower LCD resolution (less GPU/CPU load on CI emulators).
# Intended for pre-emulator-launch (after AVD create, before first boot) and after cache restore.
set -euo pipefail

AVD_NAME="${AVD_NAME:-Android_Emulator}"
AVD_HOME="${ANDROID_AVD_HOME:-${HOME}/.android/avd}"
CONFIG="${AVD_HOME}/${AVD_NAME}.avd/config.ini"

W="${LCD_WIDTH:-720}"
H="${LCD_HEIGHT:-1560}"

if [[ ! -f "$CONFIG" ]]; then
  echo "patch-avd-lcd-config: skip — not found: $CONFIG"
  exit 0
fi

ensure_kv() {
  local k="$1" v="$2" f="$3"
  if grep -q "^${k}=" "$f" 2>/dev/null; then
    sed -i.bak "s/^${k}=.*/${k}=${v}/" "$f" && rm -f "${f}.bak"
  else
    printf '\n# Lower-res LCD for CI (tools/scripts/patch-avd-lcd-config.sh)\n%s=%s\n' "$k" "$v" >>"$f"
  fi
}

echo "patch-avd-lcd-config: $CONFIG → ${W}x${H}"
ensure_kv "hw.lcd.width" "$W" "$CONFIG"
ensure_kv "hw.lcd.height" "$H" "$CONFIG"
