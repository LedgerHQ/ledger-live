# Sourced by the scripts of this composite and by boot-ios-simulators-background.

# macOS has no `timeout`: the alarm survives exec and its default action kills the command (exit 142).
# `simctl spawn` passes the SIGALRM on to the process it runs inside the simulator.
with_timeout() {
  local seconds="$1"
  shift
  perl -e 'alarm shift; exec @ARGV or die "exec failed: $!\n"' "$seconds" "$@"
}

sim_name() {
  if [[ "$1" -eq 1 ]]; then echo "iOS Simulator"; else echo "iOS Simulator $1"; fi
}
