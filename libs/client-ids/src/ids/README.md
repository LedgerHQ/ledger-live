# ID Classes

Classes for managing sensitive ID information (DeviceId).

IDs are stored in Symbol fields to prevent accidental logging. The toString() and toJSON() methods return redacted values like [DeviceId:REDACTED] so they're safe for logging and serialization.

```typescript
const deviceId = new DeviceId("device-123");
console.log(deviceId); // [DeviceId:REDACTED]
JSON.stringify({ deviceId }); // {"deviceId":"[DeviceId:REDACTED]"}
```

Export methods are restricted to specific files. The check-export-rules script enforces this by verifying usage against export-rules.json. Each ID class has export methods for specific use cases (API calls, persistence, etc.) that can only be called from allowlisted locations.

Constructors validate that IDs are non-empty strings. Use the fromString() static method to create instances from persisted data. The equals() method allows safe comparison without exposing the actual ID values.

```typescript
const id1 = DeviceId.fromString("device-123");
const id2 = new DeviceId("device-123");
id1.equals(id2); // true
```

Export methods are only available in allowlisted files. The allowlist is defined in [`export-rules.json`](../../export-rules.json).

For example, when syncing device IDs to the backend:

```typescript
// In api.ts (allowlisted file)
const deviceId = new DeviceId("device-123");
const actualId = deviceId.exportDeviceIdForPushDevicesService(); // "device-123"
// Use actualId in API request
```

#### Example from export-rules.json

```json
{
  "libs/identities/src/ids/DeviceId.ts": {
    "exportDeviceIdForPushDevicesService": ["libs/identities/src/api/api.ts"]
  }
}
```
