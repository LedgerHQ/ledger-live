import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { DmkCompatTransport, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type Transport from "@ledgerhq/hw-transport";
import type { Device } from "../../hw/actions/types";
import { toExchangeError } from "../error";

/** The connected device the way the legacy exchange code and the wallet-api hooks describe it. */
export function toLegacyDevice(connection: DeviceConnectionResult): Device {
  return {
    deviceId: connection.compatDeviceId,
    deviceName: connection.compatDeviceName,
    modelId: dmkToLedgerDeviceIdMap[connection.connectedDevice.modelId],
    wired: connection.compatDeviceWired,
  };
}

/** Exposes the executor's DMK session to code written against `Transport`. Never close it. */
export function createSessionTransport(connection: DeviceConnectionResult): Transport {
  return new DmkCompatTransport(connection.dmk, connection.sessionId);
}

export function normalizeError(error: unknown): Error {
  return toExchangeError(error);
}
