import { createCustomErrorClass } from "@ledgerhq/errors";

export const AccountNeedResync = createCustomErrorClass("AccountNeedResync");

export const TaprootNotActivated = createCustomErrorClass("TaprootNotActivated");
