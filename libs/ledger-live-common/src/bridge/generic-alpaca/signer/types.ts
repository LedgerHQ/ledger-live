import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

export type LegacySigner = {
  signTransaction: (path: string, rawTxHex: string) => Promise<string>;
};

export type AlpacaSigner<S = unknown> = {
  getAddress: GetAddressFn;
  signTransaction?: (deviceId: string, opts: SignTransactionOptions) => Promise<string>;
  signMessage?: (message: string) => Promise<string>;
  context: SignerContext<S>;
};

export type SignTransactionOptions = {
  rawTxHex: string;
  path: string;
  transaction: Buffer;
};
