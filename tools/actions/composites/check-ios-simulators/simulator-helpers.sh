# Sourced by the scripts of this composite and by boot-ios-simulators-background.

# macOS has no `timeout`. Exits 142 on timeout after killing the command's whole process group: a
# child left alive would keep its output pipe open, and a `$(...)` reading it would hang anyway.
with_timeout() {
  local seconds="$1"
  shift
  perl -e '
    my $seconds = shift;
    my $pid = fork() // die "fork failed: $!\n";
    if ($pid == 0) { setpgrp(0, 0); exec @ARGV or die "exec failed: $!\n"; }
    $SIG{ALRM} = sub { kill "KILL", -$pid; exit 142 };
    alarm $seconds;
    waitpid($pid, 0);
    exit($? & 127 ? 128 + ($? & 127) : $? >> 8);
  ' "$seconds" "$@"
}

sim_name() {
  if [[ "$1" -eq 1 ]]; then echo "iOS Simulator"; else echo "iOS Simulator $1"; fi
}
