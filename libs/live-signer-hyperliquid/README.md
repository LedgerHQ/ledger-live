<img src="https://user-images.githubusercontent.com/4631227/191834116-59cf590e-25cc-4956-ae5c-812ea464f324.png" height="100" />

[GitHub](https://github.com/LedgerHQ/ledger-live/),
[Ledger Devs Discord](https://developers.ledger.com/discord-pro),
[Developer Portal](https://developers.ledger.com/)

## @ledgerhq/live-signer-hyperliquid

Ledger Hardware Wallet Hyperliquid JavaScript bindings via Device Management Kit (DMK).

This library provides a simple interface to interact with Hyperliquid applications on Ledger devices using the Device Management Kit framework.

### Features

- Sign Hyperliquid actions via the device signer kit

### Usage

```typescript
import { Action, DmkSignerHyperliquid } from "@ledgerhq/live-signer-hyperliquid";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

// Create device management kit instance
const dmk = new DeviceManagementKit();

// Connect to device and get session ID
const sessionId = "your-session-id";

// Create signer
const signer = new DmkSignerHyperliquid(dmk, sessionId);

const certificate = new Uint8Array();
const signedMetadata = new Uint8Array();
const actions: Action[] = [];

// Sign Hyperliquid actions
const signatures = await signer.signActions(
	"44'/60'/0'/0/0",
	certificate,
	signedMetadata,
	actions,
);
```

### API

#### `DmkSignerHyperliquid`

##### Constructor

- `constructor(dmk: DeviceManagementKit, sessionId: string)`: Creates a new signer instance

##### Methods

- `signActions(path: string, certificate: Uint8Array, signedMetadata: Uint8Array, actions: Action[]): Promise<Signatures>`: Sign Hyperliquid actions

##### Exported types

- `Action`: Alias of the signer-kit action item type
- `Signature`: `{ r: string; s: string; v: number }`
- `Signatures`: `Signature[]`
