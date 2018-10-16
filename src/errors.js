// @flow
import { createCustomErrorClass } from "@ledgerhq/live-common/lib/errors";

export const SyncError = createCustomErrorClass("SyncError");
export const NetworkDown = createCustomErrorClass("NetworkDown");
export const NotEnoughBalance = createCustomErrorClass("NotEnoughBalance");
export const FeeNotLoaded = createCustomErrorClass("FeeNotLoaded");
export const NotEnoughBalanceBecauseDestinationNotCreated = createCustomErrorClass(
  "NotEnoughBalanceBecauseDestinationNotCreated",
);
export const InvalidRecipient = createCustomErrorClass("InvalidRecipient");
export const NoRecipient = createCustomErrorClass("NoRecipient");
