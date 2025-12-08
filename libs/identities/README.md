# @ledgerhq/identities

Ledger Live identities management library for managing user IDs, device IDs, and analytics consent.

## ID isolation

The main purpose of this dedicated library is to unify how Ledger Wallet manages IDs and isolate them from one another. We use ID classes that protect actual ID values by hiding them behind symbols, with strict rules that list all allowed usages.

See [ids/README.md](./src/ids/README.md) for details on the ID class pattern.

### export-rules.json

Export methods are only available in allowlisted files. The allowlist is defined in [`export-rules.json`](./export-rules.json).

To restrict the usage of ID export methods, this configuration file defines rules with the following structure:

```
{
  "path/to/file-definition.ts": {
    "nameOfAFunctionInThatFile": [
      "path/to/allowed-usage.ts"
    ]
  }
}
```

#### Example from export-rules.json

Here's a real example showing how `exportUserIdForSegment` is restricted to specific analytics files:

```json
{
  "libs/identities/src/ids/UserId.ts": {
    "exportUserIdForSegment": [
      "apps/ledger-live-desktop/src/renderer/analytics/segment.ts",
      "apps/ledger-live-mobile/src/analytics/segment.ts",
      "apps/ledger-live-mobile/src/analytics/UserIdPlugin.tsx"
    ]
  }
}
```

This ensures that `userId.exportUserIdForSegment()` can only be called from the listed analytics files, preventing accidental exposure of user IDs in unauthorized locations.

## Usage

### Basic Setup

```typescript
import { pushDevicesApi, identitiesSlice } from "@ledgerhq/identities";
import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
  reducer: {
    identities: identitiesSlice.reducer,
    [pushDevicesApi.reducerPath]: pushDevicesApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(pushDevicesApi.middleware),
});
```

### Identities can be initialized

```typescript
import { identitiesSlice } from "@ledgerhq/identities";

dispatch(identitiesSlice.actions.initFromScratch());
```

### Device IDs can be added

```typescript
import { identitiesSlice, DeviceId } from "@ledgerhq/identities";

const deviceId = new DeviceId("device-123");
dispatch(identitiesSlice.actions.addDeviceId(deviceId));
```

### Identities can be imported from legacy approach (migration)

```typescript
import { identitiesSlice } from "@ledgerhq/identities";

dispatch(identitiesSlice.actions.importFromLegacy({
  userId: "user-123",
  datadogId: "datadog-456",
}));
```

### Identities must also be persisted

```typescript
import { exportIdentitiesForPersistence, identitiesSlice } from "@ledgerhq/identities";

// Export for storage
const state = useSelector(state => state.identities);
const persisted = exportIdentitiesForPersistence(state);
const json = JSON.stringify(persisted);
await saveToStorage(json);

// Import from storage
const json = await loadFromStorage();
const persisted = JSON.parse(json);
dispatch(identitiesSlice.actions.initFromPersisted(persisted));
```

### Background Sync

to be able to synchronize the device ids with the userId, we have a middleware to hook this with backend API call.

```typescript
import { createIdentitiesSyncMiddleware } from "@ledgerhq/identities";

const identitiesSyncMiddleware = createIdentitiesSyncMiddleware({
  getState: () => store.getState(),
  dispatch: store.dispatch,
  getIdentitiesState: (state) => state.identities,
  getAnalyticsConsent: (state) => state.settings.analyticsEnabled,
});

const store = configureStore({
  reducer: { /* ... */ },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .concat(pushDevicesApi.middleware)
      .concat(identitiesSyncMiddleware),
});
```
