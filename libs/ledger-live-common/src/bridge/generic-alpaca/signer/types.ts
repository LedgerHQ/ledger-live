import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";

export type LegacySigner = {
  signTransaction: (path: string, rawTxHex: string) => Promise<string>;
};

export type AlpacaSigner<S = unknown> = {
  getAddress: GetAddressFn;
  signMessage?: (message: string) => Promise<string>;
  context: SignerContext<S>;
};

export type SignTransactionOptions = {
  rawTxHex: string;
  path: string;
  transaction: Buffer;
};
