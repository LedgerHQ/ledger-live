// Maestro onFlowStart hook: confirm the backend harness (started by run-*.sh / `pnpm e2e:mobile
// test:maestro <name>`) is reachable BEFORE the flow drives the UI. Fails fast with a clear message
// instead of a confusing mid-flow timeout when the backend was never started.
//
// NB: this only checks reachability, not full readiness — for swap/add-account the harness finishes
// init only AFTER the app connects (which happens in the flow body via launchApp), so gating on
// `ready` here would deadlock. The control server itself is up early, so /status answers immediately.
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
