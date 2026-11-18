# Sourced by the scripts of this composite and by boot-ios-simulators-background.

# macOS has no `timeout`. The deadline covers the command's exit and the close of its stdout, which a
# descendant can hold open after the command exits: a `$(...)` reading it waits for both. On timeout,
# kills the command's whole process group and exits 142.
with_timeout() {
  local seconds="$1"
  shift
  perl -e '
    my $seconds = shift;
    pipe(my $out, my $child_out) or die "pipe failed: $!\n";
    my $pid = fork() // die "fork failed: $!\n";
    if ($pid == 0) {
      setpgrp(0, 0);
      close $out;
      open(STDOUT, ">&", $child_out) or die "dup failed: $!\n";
      close $child_out;
      exec @ARGV or die "exec failed: $!\n";
    }
    close $child_out;
    $SIG{ALRM} = sub { kill "KILL", -$pid; exit 142 };
    alarm $seconds;
    while (sysread($out, my $chunk, 65536)) { syswrite(STDOUT, $chunk) }
    waitpid($pid, 0);
    exit($? & 127 ? 128 + ($? & 127) : $? >> 8);
  ' "$seconds" "$@"
}

sim_name() {
  if [[ "$1" -eq 1 ]]; then echo "iOS Simulator"; else echo "iOS Simulator $1"; fi
}
