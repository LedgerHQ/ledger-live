# @features/platform-intent-scan-accounts

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Cross-platform [Device Intent](../device-intent/README.md) that scans one currency on the
executor's open device session. Both apps use it. There is no second discovery intent:
a later scan is another function the app passes in.

## What the job does

The executor already connected the device and opened the coin app. The job calls the
app's `startScan` with that session and maps the items it emits:

| State      | Meaning                                                                                         | Terminal |
| ---------- | ----------------------------------------------------------------------------------------------- | -------- |
| `scanning` | Items found so far, and `stop`. Emitted when the scan starts, then again as each item arrives. | no       |
| `done`     | The scan finished, or the user stopped it. `items` are everything found so far.                | yes      |
| `error`    | The scan failed. `items` are everything found before the failure.                               | yes      |

`stop` unsubscribes the scan, keeps the items already found, and ends the job as `done`.
`onResult` runs before `done`. If it throws, the job emits `error` and still completes.
A scan failure becomes `error` too: the observable itself does not error, and `onResult`
is not called.

The item type is the caller's. This epic passes accounts. A later scan can pass
descriptors, which do not have to carry a string `id`. This package does not import
account discovery or `libs/`, and it does not call `withDevice`.

## Usage

The app owns the scan. For this epic that is `currencyBridge.scanAccounts` with
`deviceConnectionResult.compatDeviceId`. The screen is added by the Add Account flow, not by this package.

```ts
import { createIntent } from "@features/platform-device-intent";
import { createScanAccountsIntentDefinition } from "@features/platform-intent-scan-accounts";
import { map } from "rxjs";

const scanAccountsIntent = {
  ...createScanAccountsIntentDefinition<Account>(),
  component: ScanAccountsView,
};

const intent = createIntent(scanAccountsIntent, {
  startScan: ({ compatDeviceId }) =>
    bridge.scanAccounts({ currency, deviceId: compatDeviceId, syncConfig }).pipe(
      map(event => event.account),
    ),
});
```

`startScan` must stop when it is unsubscribed. `scanAccounts` already does.
