// onFlowStart hook: fail fast if the backend harness isn't reachable. Checks reachability only, not
// readiness — the harness finishes init after the app connects (in the flow body), so /status, not
// /ready, is what answers early.
var url = "http://localhost:8100/status";
var res;
try {
  res = http.get(url);
} catch (e) {
  throw "Maestro backend harness not reachable at " +
    url +
    " — start it via `pnpm e2e:mobile test:maestro <name>`. (" +
    e +
    ")";
}
if (!res || res.status !== 200) {
  throw "Maestro backend harness returned " +
    (res ? res.status : "no response") +
    " from " +
    url +
    " — is the harness running?";
}
console.log("[hook] backend reachable (" + res.status + "): " + res.body);
