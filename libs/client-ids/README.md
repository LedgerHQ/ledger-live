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

Here's a real example showing how `exportDeviceIdForPushDevicesService` is restricted to specific API files:

```json
{
  "libs/identities/src/ids/DeviceId.ts": {
    "exportDeviceIdForPushDevicesService": [
      "libs/identities/src/api/api.ts"
    ]
  }
}
```

This ensures that `deviceId.exportDeviceIdForPushDevicesService()` can only be called from the listed API files, preventing accidental exposure of device IDs in unauthorized locations.

## Usage

### Basic Setup

```typescript
import { pushDevicesApi } from "@ledgerhq/identities/api";
import { identitiesSlice } from "@ledgerhq/identities/store";
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

### Device IDs can be added

```typescript
import { DeviceId } from "@ledgerhq/identities/ids";
import { identitiesSlice } from "@ledgerhq/identities/store";

const deviceId = DeviceId.fromString("device-123");
dispatch(identitiesSlice.actions.addDeviceId(deviceId));
```

### Identities must also be persisted

```typescript
import { exportIdentitiesForPersistence, identitiesSlice } from "@ledgerhq/identities/store";

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

To synchronize device IDs with the backend, use the sync middleware. Note that `UserId` and `DatadogId` are managed by apps (not in the identities store), so you need to provide a selector for `userId`:

```typescript
import { createIdentitiesSyncMiddleware } from "@ledgerhq/identities/store";
import { pushDevicesApi } from "@ledgerhq/identities/api";

const identitiesSyncMiddleware = createIdentitiesSyncMiddleware({
  getIdentitiesState: (state) => state.identities,
  getUserId: (state) => {
    // Get userId from app storage (e.g., localStorage, async storage)
    // This is managed by apps, not by the identities store
    return getUserIdFromAppStorage();
  },
  getAnalyticsConsent: (state) => state.settings.analyticsEnabled,
});

const store = configureStore({
  reducer: { 
    identities: identitiesSlice.reducer,
    [pushDevicesApi.reducerPath]: pushDevicesApi.reducer,
    // ... other reducers
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .concat(pushDevicesApi.middleware)
      .concat(identitiesSyncMiddleware),
});
```

**Note**: `UserId` and `DatadogId` classes are available for future use but are not currently stored in the identities Redux store. They are managed by apps directly.
