import Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "../../types";
import type { DerivationMode } from "../../derivation";
export type Result = {
  rsv: {
    r: string;
    s: string;
    v: number;
  };
  signature: string;
};
export type MessageData = {
  currency: CryptoCurrency;
  path: string;
  verify?: boolean;
  derivationMode: DerivationMode;
  message: string;
  rawMessage: string;
};
export type Resolver = (arg0: Transport, arg1: MessageData) => Promise<Result>;
