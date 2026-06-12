/**
 * Minimal shape needed to choose a device: a stable id and a display name. The
 * name is optional because DMK discovery can report devices without one (BLE
 * advertisements in particular); matching must tolerate that instead of throwing.
 */
export interface SelectableDevice {
  readonly id: string;
  readonly name?: string;
}

let selectorOverride: string | null = null;

/**
 * Set the per-invocation device selector, typically from a command's `--device`
 * flag. Takes precedence over the `WALLET_CLI_DEVICE` env var. Pass null/blank to
 * clear it.
 */
export function setDeviceSelectorOverride(value: string | null | undefined): void {
  const trimmed = value?.trim();
  selectorOverride = trimmed ? trimmed : null;
}

/**
 * Resolve the device selector: the `--device` flag override if set, else the
 * `WALLET_CLI_DEVICE` env var (mirrors how the transport is chosen via
 * `WALLET_CLI_TRANSPORT`). Matches a discovered device by exact transport id or
 * case-insensitive name. Returns null when neither is set.
 */
export function resolveDeviceSelector(): string | null {
  if (selectorOverride) {
    return selectorOverride;
  }
  const raw = process.env.WALLET_CLI_DEVICE?.trim();
  return raw ? raw : null;
}

/**
 * A discovered device matches the selector by transport id (exact or a unique
 * prefix — ids can be long, and a short prefix is enough when unambiguous) or by
 * a case-insensitive substring of its name, so a distinctive word works without
 * quoting a multi-word name (e.g. `--device nano` for "Ledger Nano S Plus").
 * Ambiguity (a prefix/substring matching several devices) is rejected by
 * selectDiscoveredDevice, which lists the candidates so the user can be specific.
 */
export function deviceMatchesSelector(device: SelectableDevice, selector: string): boolean {
  const needle = selector.toLowerCase();
  const id = device.id.toLowerCase();
  if (id === needle || id.startsWith(needle)) {
    return true;
  }
  const name = device.name ?? "";
  return name.length > 0 && name.toLowerCase().includes(needle);
}

function describeDevices(devices: readonly SelectableDevice[]): string {
  return devices.map(device => `${device.name || "(unnamed)"} [${device.id}]`).join(", ");
}

/**
 * Pick the device to connect to from the discovered list.
 *
 * - With a selector (`WALLET_CLI_DEVICE`): require exactly one match, else throw
 *   with the candidate list so the caller can disambiguate.
 * - Without a selector: use the only device if there is one; if several are
 *   present, refuse to guess and ask the user to set `WALLET_CLI_DEVICE`.
 *
 * This makes "which device?" deterministic across transports (USB and BLE)
 * instead of silently connecting to whichever was discovered first.
 */
export function selectDiscoveredDevice<T extends SelectableDevice>(
  discovered: readonly T[],
  selector: string | null,
): T {
  if (discovered.length === 0) {
    throw new Error("No Ledger device found. Unlock the device and try again.");
  }

  if (selector) {
    const matches = discovered.filter(device => deviceMatchesSelector(device, selector));
    if (matches.length === 0) {
      throw new Error(
        `No Ledger device matching "${selector}". Discovered: ${describeDevices(discovered)}. ` +
          "Run `devices` to list reachable Ledgers.",
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `"${selector}" matches multiple devices: ${describeDevices(matches)}. ` +
          "Use a more specific id (run `devices` to see them).",
      );
    }
    return matches[0]!;
  }

  if (discovered.length === 1) {
    return discovered[0]!;
  }

  throw new Error(
    `Multiple Ledger devices found: ${describeDevices(discovered)}. ` +
      "Choose one with --device <name|id> (or WALLET_CLI_DEVICE).",
  );
}
