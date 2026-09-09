---
"@ledgerhq/live-countervalues-react": patch
---

Don't arm the countervalues polling loop while refreshRate is 0

Both apps initialise `refreshRate` to 0 and overwrite it from LiveConfig once it resolves. Until then the loop re-armed itself with `setTimeout(pollingLoop, 0)`, so it spun at zero delay, dispatching `setPollingTriggerLoad(true)` into Redux on every tick. Polling now waits for a positive refresh rate; the effect already re-runs when one arrives.
