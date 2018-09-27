// @flow

import { createCustomErrorClass } from "./logic/errors";

export const SyncError = createCustomErrorClass("SyncError");
export const NetworkDown = createCustomErrorClass("NetworkDown");
