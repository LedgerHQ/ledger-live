import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { DomainServiceResolution } from "@ledgerhq/types-live";

export type GenericSigner = {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
  signTransaction: (
    path: string,
    rawTxHex: string,
    recipientDomain?: DomainServiceResolution,
  ) => Promise<string>;
};

export type AlpacaSigner = {
  getAddress: GetAddressFn;
  context: SignerContext<GenericSigner>;
};

export type SignTransactionOptions = {
  rawTxHex: string;
  path: string;
  transaction: Buffer;
};
