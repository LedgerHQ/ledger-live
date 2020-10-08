// @flow
import type Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "../../types";
import type { DerivationMode } from "../../derivation";

export type Result = {
  address: string,
  path: string,
  publicKey: string,
  chainCode?: string,
};

export type GetAddressOptions = {
  currency: CryptoCurrency,
  path: string,
  derivationMode: DerivationMode,
  verify?: boolean,
  skipAppFailSafeCheck?: boolean,
  askChainCode?: boolean,
  forceFormat?: string,
};

export type Resolver = (
  Transport<*>,
  {
    currency: CryptoCurrency,
    path: string,
    derivationMode: DerivationMode,
    verify?: boolean,
    skipAppFailSafeCheck?: boolean,
    askChainCode?: boolean,
    forceFormat?: string,
  }
) => Promise<Result>;
