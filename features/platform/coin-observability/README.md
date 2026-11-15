# @features/platform-coin-observability

> [!CAUTION]
> **Status: UNSTABLE** — New package; API may change.

Coin-module call events, shared by Ledger Wallet Desktop and Mobile: the event shape, the observer
registry, and the transmission policy a sink applies before sending them anywhere.

The events are emitted by `withMetrics`, the adapter `@ledgerhq/live-common` applies to every module
its coin-module resolver hands out. That adapter is the only part left in live-common; everything a
host needs to consume the events lives here, with no legacy import.

## What is in it

- `CoinModuleCallEvent`: method, currency, family, duration and outcome
  (`success` / `failure` / `not_supported`), plus the error name and category on failure. Never the
  arguments or the result.
- `setCoinModuleCallObserver` / `emitCoinModuleCall`: a global registry. The coin-module is resolved
  outside React, so a host registers its observers once at startup. A throwing observer never breaks
  the call it observes.
- `createCoinModuleCallTransmitter`: the policy for a sink that leaves the process:
  - transaction-path calls (`craftTransaction`, `craftRawTransaction`, `craftTransactionData`,
    `combine`, `broadcast`) are always sent;
  - preparation successes (`estimateFees`, `validateIntent`, called on every edit of a
    transaction) and read-path successes are sampled per app session, each tier with its own rate:
    a session sends all of them or none;
  - failures are capped per method, currency and error name, per hour;
  - `includeSyncPath: false` drops the read path entirely, failures included;
  - each sent call carries its tier's `sampleRate` and whether the session is `inSample`. Failures
    come from every session and successes only from the sample, so a failure rate is computed on
    `inSample` calls only, and a success count is divided by `sampleRate` to estimate the volume.
- `setCoinObservabilityConfigReader` / `toCoinObservabilityConfig`: the host injects its
  `coinObservability` flag. Until it does, transmission stays off.

## Usage

```ts
import {
  createCoinModuleCallTransmitter,
  readCoinObservabilityConfig,
  setCoinModuleCallObserver,
  setCoinObservabilityConfigReader,
  toCoinObservabilityConfig,
} from "@features/platform-coin-observability";

// At boot, once the store exists.
setCoinObservabilityConfigReader(() =>
  toCoinObservabilityConfig(selectFeature(store.getState(), "coinObservability")),
);

// The sink: the transmitter decides, the host sends.
const transmit = createCoinModuleCallTransmitter(readCoinObservabilityConfig);
setCoinModuleCallObserver(event => {
  if (transmit(event)) sendToDatadog(event);
});
```

Consent stays the host's job: the config reader is the place to return `null` when the user has not
opted in.
