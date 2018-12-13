// @flow
import { createCustomErrorClass } from "@ledgerhq/live-common/lib/errors/helpers";

export const BluetoothRequired = createCustomErrorClass("BluetoothRequired");
export const GenuineCheckFailed = createCustomErrorClass("GenuineCheckFailed");
export const PairingFailed = createCustomErrorClass("PairingFailed");
export const SyncError = createCustomErrorClass("SyncError");
export const NotEnoughBalanceBecauseDestinationNotCreated = createCustomErrorClass(
  "NotEnoughBalanceBecauseDestinationNotCreated",
);
export const UnexpectedBootloader = createCustomErrorClass(
  "UnexpectedBootloader",
);
