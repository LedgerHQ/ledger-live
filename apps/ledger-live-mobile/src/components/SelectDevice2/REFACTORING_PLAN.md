# SelectDevice2 Refactoring Plan

## Target State

After refactoring, `SelectDevice` is a pipeline orchestrator. Each concern lives in a dedicated hook or helper, and a single discriminated union makes the current connection phase explicit.

```typescript
type DeviceConnectionPhase =
  | { phase: "idle" }
  | { phase: "ble_requirements_pending"; device: DisplayedDevice }
  | { phase: "ble_device_unavailable"; device: DisplayedDevice }
  | { phase: "verifying_lock_status"; device: DisplayedAvailableDevice };

function SelectDevice({ onSelect, performDeviceLockedCheck, ... }: Props) {
  const [connectionPhase, setConnectionPhase] = useState<DeviceConnectionPhase>({ phase: "idle" });

  // ── Discovery ──────────────────────────────────────────────────
  const { hidDevices, scannedDevices, bleScanningState } = useDeviceDiscovery({
    isFocused, stopBleScanning, isMockMode,
    pauseScanning: connectionPhase.phase === "verifying_lock_status",
    pairingFlowStep,
  });

  // ── Device List ────────────────────────────────────────────────
  const deviceList = useDeviceList({
    bleKnownDevices, filteredScannedDevices, hidDevices,
    proxyDevice, filterByDeviceModelId,
  });

  // ── Choose ─────────────────────────────────────────────────────
  const handleDeviceChosen = useCallback((device: DisplayedDevice) => {
    if (isBleDevice(device)) {
      setConnectionPhase({ phase: "ble_requirements_pending", device });
    } else {
      if (!device.available) return;
      setConnectionPhase({ phase: "verifying_lock_status", device });
    }
  }, []);

  useAutoSelectDevice({ ..., onAutoSelect: handleDeviceChosen });

  // ── BLE Resolution ─────────────────────────────────────────────
  const bleResolution = useBleDeviceResolution({
    pendingDevice: connectionPhase.phase === "ble_requirements_pending"
      ? connectionPhase.device : null,
    scannedDevices,
    onResolved: (device) => setConnectionPhase({ phase: "verifying_lock_status", device }),
    onCancelled: () => setConnectionPhase({ phase: "idle" }),
  });

  // ── Lock Verification ──────────────────────────────────────────
  const lockVerification = useDeviceLockVerification({
    device: connectionPhase.phase === "verifying_lock_status"
      ? connectionPhase.device : null,
    performCheck: performDeviceLockedCheck,
    onVerified: confirmDevice,
  });

  // ── Confirm ────────────────────────────────────────────────────
  const confirmDevice = useCallback((device, discoveredDevice) => {
    dispatch(setLastConnectedDevice(device));
    // ... other dispatches ...
    onSelect(device, discoveredDevice);
    setConnectionPhase({ phase: "idle" });
  }, [onSelect, dispatch]);

  // ── UI ─────────────────────────────────────────────────────────
  // Renders device list, drawers (from hook outputs), pairing flow, etc.
}
```

The pipeline reads top-to-bottom: **discover → list → choose → resolve → verify → confirm**.

---

## Concerns Inventory

The component today manages **7 distinct concerns** all inline. Here is the full inventory, what each one does, and how the target state improves it.

---

### 1. Device Discovery

**What it does:** Runs HID and BLE discovery (with mock/real swapping for e2e), controls when scanning is active (paused during pairing, lock checks, or when screen is unfocused).

**Today:** ~20 lines of interleaved `useMockHidDevicesDiscovery` / `useHidDevicesDiscovery` / `useMockBleDevicesScanning` / `useBleDevicesScanning` with conditional `scanningEnabled` logic spread across the top of the component.

**Target:** Extracted into `useDeviceDiscovery`. The mock/real swapping and scanning-pause logic become internal concerns. The parent gets `{ hidDevices, scannedDevices, bleScanningState }` and passes simple booleans to control pausing.

```typescript
function useDeviceDiscovery(params: {
  isFocused: boolean;
  stopBleScanning?: boolean;
  pauseScanning: boolean;    // true during lock check or pairing
  pairingFlowStep: PairingFlowStep | null;
  filterByDeviceModelId?: DeviceModelId;
}): {
  hidDevices: HIDDiscoveredDevice[];
  scannedDevices: ScannedDevice[];
  filteredScannedDevices: ScannedDevice[];
  bleScanningState: BleScanningState;
};
```

**Why it's better:** The mock/real branching and scanning lifecycle are implementation details the main component shouldn't care about.

---

### 2. Device List Construction

**What it does:** Builds the list of devices to display by:
- Matching Redux-stored known BLE devices against current scan results (by device ID or name, to handle BLE address changes)
- Marking matched devices as `available: true` with their `DiscoveredDevice`
- Marking unmatched known devices as `available: false` (greyed out)
- Prepending any HID (USB) device
- Prepending any proxy/Speculos device
- Sorting available devices first
- Filtering by model ID if requested

It also **syncs known device names** in Redux when a scanned device reports a different name than what's stored (happens after OS-level BLE name changes).

**Today:** ~50 lines in a `useMemo` (device list) + a `useEffect` (name sync), both doing their own `findMatchingNewDevice` / `findMatchingNewDeviceIndex` lookups against the same data.

**Target:** Extracted into `useDeviceList`. The matching, sorting, name-sync side effect, and proxy injection all live together. The parent gets a `DisplayedDevice[]`.

```typescript
function useDeviceList(params: {
  bleKnownDevices: DeviceLike[];
  filteredScannedDevices: ScannedDevice[];
  hidDevices: HIDDiscoveredDevice[];
  proxyDevice: Device | undefined;
  filterByDeviceModelId?: DeviceModelId;
}): DisplayedDevice[];
```

**Why it's better:** The known-device ↔ scanned-device matching logic (including the name-based fallback for BLE address changes) is non-trivial and deserves its own unit tests. Today it's buried in a `useMemo` and tested only indirectly. The name-sync effect is a side concern that shouldn't sit next to connection pipeline code.

---

### 3. Connection Phase State

**What it does:** Tracks where we are in the device connection pipeline: idle, waiting for BLE requirements, waiting for device availability, or verifying lock status.

**Today:** Spread across 3+ independent `useState` calls:

```typescript
const [selectedBleDevice, setSelectedBleDevice] = useState(null);
const [showSelectedBleDeviceNotAvailableDrawer, setShow...] = useState(false);
const [deviceToCheckLockedStatus, setDeviceToCheckLockedStatus] = useState(null);
```

Nothing prevents multiple phases from being active simultaneously (e.g. `selectedBleDevice` set while `deviceToCheckLockedStatus` is also set).

**Target:** Single `DeviceConnectionPhase` discriminated union (see top of this document).

**Why it's better:** Impossible states are unrepresentable. Only one phase is active at a time, which also naturally prevents conflicts between USB and BLE transports. Any reader can look at `connectionPhase` and immediately know what the component is doing.

---

### 4. BLE Resolution

**What it does:** When a BLE device is chosen, this concern:
1. Enforces BLE requirements (permissions, Bluetooth enabled) via `useDebouncedRequireBluetooth`
2. Matches the chosen device against current scan results (the device might have gone out of range)
3. If requirements are met but device isn't in scan results, shows a "device not available" drawer
4. If the device reappears while the drawer is open, auto-proceeds
5. When both requirements are met and device is found, produces a `DisplayedAvailableDevice`

**Today:** ~60 lines split across a `useMemo`, a multi-branch `useEffect`, and several state variables. The effect handles 3 different sub-cases with early returns, making it the densest and hardest-to-follow part of the component.

**Target:** Extracted into `useBleDeviceResolution`.

```typescript
function useBleDeviceResolution(params: {
  pendingDevice: DisplayedDevice | null;
  scannedDevices: ScannedDevice[];
  onResolved: (device: DisplayedAvailableDevice) => void;
  onCancelled: () => void;
}): {
  bluetoothRequirementsState: BluetoothRequirementsState;
  retryRequestOnIssue: () => void;
  cannotRetryRequest: boolean;
  showUnavailableDrawer: boolean;
  onCloseUnavailableDrawer: () => void;
};
```

**Why it's better:** The BLE requirements → scan matching → drawer logic is a self-contained state machine. Extracting it makes each sub-case independently testable and removes the most complex effect from the main component. The parent just passes a pending device and reacts to `onResolved` / `onCancelled`.

---

### 5. Lock Verification

**What it does:** Given a resolved, available device, connects to check if it's locked. Shows a drawer if locked, calls back when unlocked. Can be skipped via `performDeviceLockedCheck` prop or in mock environments.

**Today:** ~25 lines across `checkDeviceStatus`, `deviceToCheckLockedStatus` state, `handleDeviceUnlocked`, `handleDeviceLockedCheckClosed`, plus the `DeviceLockedCheckDrawer` JSX wiring.

**Target:** Extracted into `useDeviceLockVerification`.

```typescript
function useDeviceLockVerification(params: {
  device: DisplayedAvailableDevice | null;
  performCheck: boolean;
  onVerified: (device: Device, discoveredDevice: DiscoveredDevice) => void;
}): {
  isChecking: boolean;
  drawerDevice: Device | null;
  onDeviceUnlocked: () => void;
  onClose: () => void;
};
```

**Why it's better:** Small, self-contained concern that's easy to test in isolation. Removes 4 callbacks and 1 state variable from the main component.

---

### 6. Naming

**What it does:** Names should reflect which pipeline phase a callback or state variable belongs to.

**Today:** "select" is used at every stage. `handleOnSelect`, `selectedBleDevice`, `notifyDeviceSelected`, `handleOnSelectFromPairingFlow` all sound like the same thing.

**Target:**

| Current name                               | Target name                      | Phase   |
| ------------------------------------------ | -------------------------------- | ------- |
| `handleOnSelect`                           | `handleDeviceChosen`             | choose  |
| `selectedBleDevice`                        | `pendingBleDevice`               | resolve |
| `availableDeviceMatchingSelectedBleDevice` | `resolvedBleDevice`              | resolve |
| `showSelectedBleDeviceNotAvailableDrawer`  | `showBleDeviceUnavailableDrawer` | resolve |
| `checkDeviceStatus`                        | `verifyDevice`                   | verify  |
| `deviceToCheckLockedStatus`                | `devicePendingVerification`      | verify  |
| `notifyDeviceSelected`                     | `confirmDevice`                  | confirm |
| `handleOnSelectFromPairingFlow`            | `handlePairingSuccess`           | choose  |

**Why it's better:** Each name tells you where in the pipeline you are. No more guessing whether "select" means "user tapped" or "device is ready."

---

### 7. Proxy / Mock Devices (Legacy)

**What it does:** Discovers proxy devices (Speculos/httpdebug) via the legacy `discoverDevices` observable. These are not DMK-managed devices -- they use a completely separate discovery mechanism and get injected into the device list with a stub `DiscoveredDevice` (`makeMockDiscoveredDevice`). In `handleOnSelect`, proxy devices are detected via `deviceId.includes("httpdebug")` and skip the BLE requirements path entirely, going straight to lock verification like USB devices.

There's also the mock/real hook swapping (`isMockMode` flag toggling between `useMockHidDevicesDiscovery` / `useMockBleDevicesScanning` and the real hooks) which is a separate but related legacy concern for e2e test support.

**Today:** Proxy discovery is a standalone `useEffect` with an observable subscription. Mock mode branching is ad-hoc conditionals scattered at the top of the component. The `handleOnSelect` callback has a special `isProxyDebug` branch. The device list `useMemo` has a special proxy prepend block.

**Target (for now):** Keep proxy discovery and mock mode as-is. They are legacy and will be removed when the DMK handles these transports natively (proxy will become a regular USB-like device discovered via DMK, mock mode will be handled at the transport level). The refactoring should not try to clean these up -- just make sure they still work in the new structure:

- Proxy device stays injected into `useDeviceList` as a device source
- The `handleDeviceChosen` callback still routes proxy/mock devices to the USB-like path (skip BLE resolution, go to verification)
- Mock hook swapping stays in `useDeviceDiscovery`

**Future:** Once DMK handles proxy/mock transports, all of this disappears. Proxy devices will appear in `hidDevices` like any USB device, and mock mode branching will be unnecessary because the real hooks will work transparently with mocked transports.

---

### 8. Remaining Inline Concerns

These are smaller and can stay in the main component:

- **Pairing flow** (`isPairingDevices`, `pairingFlowStep`): Controls whether `BleDevicePairingFlow` is rendered instead of the device list. Simple boolean toggle, fine inline.

- **Add new device drawer** (`isAddNewDrawerOpen`): Controls the "Set up new / Connect existing" choice drawer. Simple boolean toggle, fine inline.

- **Navigation visibility** (~15 lines): Tab bar hide/show on focus/unfocus/unmount. Could be extracted into a `useTabBarVisibility` hook for clarity, but low priority.

- **Analytics** (tracking events, screen props): Stays inline, it's just a few `useMemo` + `track` calls.
