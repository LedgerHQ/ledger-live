// Maestro onFlowStart hook (send-doge): fetch the device-derived recipient + amount from the backend
// harness over HTTP, instead of bash reading a temp file and passing them via `-e`. Maestro can't
// derive a device address, so the harness derives it (the Dogecoin 2 account) and serves it on its
// control endpoint; the flow pulls it into output vars used by the recipient/amount inputs.
//
// run-send-doge.sh gates on /recipient being 200 before launching Maestro, so this is set by now.
var base = "http://localhost:8100";

var rcpt = http.get(base + "/recipient");
if (!rcpt || rcpt.status !== 200 || !rcpt.body) {
  throw "Backend harness has no recipient (" +
    (rcpt ? rcpt.status : "no response") +
    ") at " +
    base +
    "/recipient — is the send-doge harness running?";
}
output.recipient = String(rcpt.body).trim();

var amt = http.get(base + "/amount");
output.amount =
  amt && amt.status === 200 && amt.body ? String(amt.body).trim() : "0.01";

console.log("[hook] send recipient=" + output.recipient + " amount=" + output.amount);
