// onFlowStart hook (send-doge): the recipient (Dogecoin 2) is derived on-device by the harness, so
// fetch it (+ amount) from the control endpoint into output vars for the recipient/amount inputs.
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
