# Apps store logic: manage your ledger device apps

> Don't know what is an App?
>
> You can find more about them on our [support page](https://support.ledger.com/hc/en-us/categories/115000811829-Apps).
>
> - Prerequisite for device communication: [@ledgerhq/hw-transport](https://github.com/LedgerHQ/ledgerjs#ledgerhqhw-transport-)

The Apps store logic provides a set of tools and interfaces to manage your ledger device apps.

You can install, uninstall, update and check your ledger device status.

# Communicate with your device

**[hw](../src/apps/hw.ts)**

Holds transport logic to execute App operations on your device and fetch the Apps State.

`execWithTransport` executes a given App operation - [AppOp](../src/apps/types.ts) on the device

Used to install, uninstall or update device Apps.

Returns [Observable<{ progress: number }>](../src/apps/types.ts)

```js
import { execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";

const appOp = { type: "install", name: app.name };

const appsObservable$ = execWithTransport(transport)(appOp, targetId, app);
```

`listApps` is used to retrieve apps data per device.

Available Apps and versions vary from device firmware version and model.

Returns an Observable<[ListAppEvents](../src/apps/types.ts)>

```js
import { listApps } from "@ledgerhq/live-common/lib/apps/hw";

const appsObservable$ = listApps(transport, deviceInfo).pipe(
  filter(({ type }) => type === "result"),
  map(({ result }) => result)
);
```

# View and manage your device state

**[logic](../src/apps/logic.ts)**

Hold the device state logic used by the [AppOp](../src/apps/types.ts) [runner](../src/apps/runner.ts).

`reducer` is used to manage changes in the device [State](../src/apps/types.ts).

`distribute` gives the device app storage distribution from a given State

Returns [AppsDistribution](../src/apps/types.ts).

`predictOptimisticState` helps retrieve the future [State](../src/apps/types.ts) after an [AppOp](../src/apps/types.ts) is successfully run on your device.

**[react](../src/apps/react.ts)**

Holds react specific logic with hooks to manage the device state.

`useAppsRunner` react hook to handle a device State with an AppOp dispatcher.
Returns UseAppsRunnerResult

**[filtering](../src/apps/filtering.ts)**

React hooks used to search and filter through a given list of apps.

**[runner](../src/apps/runner.ts)**

Transform the device communication during App Operations into the Apps [logic](../src/apps/logic.ts) State reducer.

`runAppOp` executes a given [AppOp](../src/apps/types.ts) on the device. Used in [useAppsRunner](../src/apps/react.ts).

Returns an Observable of [RunnerEvents](../src/apps/types.ts).

**[types](../src/apps/types.ts)**
