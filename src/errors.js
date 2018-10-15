// @flow

import { createCustomErrorClass } from "./logic/errors";

export const SyncError = createCustomErrorClass("SyncError");
export const NetworkDown = createCustomErrorClass("NetworkDown");
export const NotEnoughBalance = createCustomErrorClass("NotEnoughBalance");
export const FeeNotLoaded = createCustomErrorClass("FeeNotLoaded");
export const NotEnoughBalanceBecauseDestinationNotCreated = createCustomErrorClass(
  "NotEnoughBalanceBecauseDestinationNotCreated",
);
