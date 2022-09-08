import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Transport from "@ledgerhq/hw-transport";
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
export type SignMessage = (
  transport: Transport,
  message: MessageData
) => Promise<Result>;
