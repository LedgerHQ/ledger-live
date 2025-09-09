import { createCustomErrorClass } from "@ledgerhq/errors";

export const UnsupportedDerivation = createCustomErrorClass("UnsupportedDerivation");

/** When a coin-module has no CoinConfig setted */
export const MissingCoinConfig = createCustomErrorClass("MissingCoinConfig");
