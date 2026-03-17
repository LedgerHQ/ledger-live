import { createCustomErrorClass } from "@ledgerhq/errors";

/** When a coin-module has no CoinConfig setted */
export const MissingCoinConfig = createCustomErrorClass("MissingCoinConfig");
