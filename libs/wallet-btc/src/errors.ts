import { createCustomErrorClass } from "@ledgerhq/errors";

// wallet-btc domain errors. Re-exported by @ledgerhq/coin-bitcoin for
// backward compatibility (see coin-bitcoin/src/errors.ts).
export const AccountNeedResync = createCustomErrorClass("AccountNeedResync");

export const RbfBuildError = createCustomErrorClass("RbfBuildError");

export const UnsupportedDerivation = createCustomErrorClass("UnsupportedDerivation");
