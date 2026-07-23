---
name: client-ids
description: Privacy-protected ID management with @domain/entity-client-identity — DeviceId, UserId, DatadogId, export-rules.json
---

# Client Identity Domain (`@domain/entity-client-identity`)

## Privacy & Security

Sensitive identifiers (DeviceId, UserId, DatadogId) must always use the domain entity package:

- **Never** use raw string IDs for devices, users, or analytics.
- **Always** use `DeviceId`, `UserId`, or `DatadogId` classes from `@domain/entity-client-identity`.
- ID values are only accessible through explicit export methods (e.g., `exportUserIdForSomething()`).
- Every export method must be allowlisted in `domain/entity/client-identity/export-rules.json`.
- Export IDs only at system boundaries (API calls, persistence) — never in the middle of processing.
- `toString()` and `toJSON()` return `[DeviceId:REDACTED]` by design.

---

## Package layout

| Package | Location | What it contains |
|---|---|---|
| `@domain/entity-client-identity` | `domain/entity/client-identity/` | DeviceId, UserId, DatadogId classes + Redux slice, selectors, persistence |
| `@domain/api-push-devices` | `domain/api/push-devices/` | RTK Query mutation + Redux sync middleware |

## Core Principles

### 1. All ID Usage Must Go Through This Package

- **Never** create raw string IDs for devices, users, or analytics
- **Always** use `DeviceId`, `UserId`, or `DatadogId` classes from `@domain/entity-client-identity`
- IDs are protected by Symbols and automatically redacted in logs/JSON

### 2. Privacy Protection

- IDs are stored in Symbol fields to prevent accidental access
- `toString()` and `toJSON()` return `[DeviceId:REDACTED]` by default
- Actual ID values are only accessible through **explicit export methods**

### 3. Explicit Use Cases

- Every ID usage must be **explicitly declared** through a dedicated export method (e.g., `exportUserIdForSomethingSomething()`)
- Export methods represent **specific, documented use cases** and can only be called from allowlisted files
- The `export-rules.json` file in `domain/entity/client-identity/` serves as a **registry of all allowed use cases**
- The `check-export-rules.mjs` script enforces the allowlist at build time

## Usage Requirements

### Using an existing ID for a new use case

- Add a new export method on the class (e.g., `exportUserIdForSomethingSomething()`)
- Add your file to `domain/entity/client-identity/export-rules.json`:
  ```json
  {
    "domain/entity/client-identity/src/ids/UserId.ts": {
      "exportUserIdForSomethingSomething": [
        "your/new/file/path.ts"
      ]
    }
  }
  ```
- Use the method only from the allowlisted file (at the system boundary)

### Introducing a new kind of ID

- Create a new class in `domain/entity/client-identity/src/ids/` (e.g., `NewId.ts`)
- Follow the pattern from `DeviceId.ts`: Symbol storage, redacted toString/toJSON, export methods
- Add export methods with allowlist rules in `export-rules.json`

```typescript
import { DeviceId } from "@domain/entity-client-identity";

// ✅ Correct: Use the domain entity
const deviceId = DeviceId.fromString("device-123");

// ❌ Wrong: Don't use raw strings
const deviceId = "device-123"; // BAD
```
