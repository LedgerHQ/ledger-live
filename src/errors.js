// @flow
import { createCustomErrorClass } from "@ledgerhq/live-common/lib/errors";

export const GenuineCheckFailed = createCustomErrorClass("GenuineCheckFailed");
export const PairingFailed = createCustomErrorClass("PairingFailed");
export const DeviceNameRequired = createCustomErrorClass("DeviceNameRequired");
export const SyncError = createCustomErrorClass("SyncError");
export const NetworkDown = createCustomErrorClass("NetworkDown");
export const NotEnoughBalance = createCustomErrorClass("NotEnoughBalance");
export const FeeNotLoaded = createCustomErrorClass("FeeNotLoaded");
export const NotEnoughBalanceBecauseDestinationNotCreated = createCustomErrorClass(
  "NotEnoughBalanceBecauseDestinationNotCreated",
);
export const InvalidRecipient = createCustomErrorClass("InvalidRecipient");
export const NoRecipient = createCustomErrorClass("NoRecipient");
