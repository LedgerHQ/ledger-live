import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type BitcoinXPub = string;
export type BitcoinAddress = {
  publicKey: string;
  bitcoinAddress: string;
  chainCode: string;
};
export type BitcoinSignature = {
  v: number;
  r: string;
  s: string;
};
export type AddressFormat = "legacy" | "p2sh" | "bech32" | "bech32m" | "cashaddr";

export interface BitcoinSigner {
  getWalletXpub(arg: { path: string; xpubVersion: number }): Promise<BitcoinXPub>;
  getWalletPublicKey(
    path: string,
    opts?: {
      verify?: boolean;
      format?: AddressFormat;
    },
  ): Promise<BitcoinAddress>;
  signMessage(path: string, messageHex: string): Promise<BitcoinSignature>;

  splitTransaction(
    transactionHex: string,
    isSegwitSupported: boolean | null | undefined,
    hasExtraData: boolean | null | undefined,
    additionals: Array<string> | null | undefined,
  ): SignerTransaction;
  createPaymentTransaction(arg: CreateTransaction): Promise<string>;
  signPsbtBuffer?(
    psbtBuffer: Buffer,
    options: {
      finalizePsbt?: boolean;
      accountPath: string;
      addressFormat: AddressFormat;
      onDeviceSignatureRequested: (() => void) | undefined;
      onDeviceSignatureGranted: (() => void) | undefined;
      onDeviceStreaming:
        | ((arg: { progress: number; total: number; index: number }) => void)
        | undefined;
      addressScanLimit?: number;
    },
  ): Promise<{ psbt: Buffer; tx?: string }>;
}

export type SignerResult = BitcoinXPub | BitcoinAddress | BitcoinSignature;
export type SignerContext = <T>(
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: BitcoinSigner) => Promise<T>,
) => Promise<T>;

// The following types are directly extracted from hw-app-btc
// The goal would be to either share them in a third party lib, or find a pivot format, or marshallize them...
export type SignerTransactionInput = {
  prevout: Buffer;
  script: Buffer;
  sequence: Buffer;
  tree?: Buffer;
};
export type SignerTransactionOutput = {
  amount: Buffer;
  script: Buffer;
};
export type SignerTransaction = {
  version: Buffer;
  inputs: SignerTransactionInput[];
  outputs?: SignerTransactionOutput[];
  locktime?: Buffer;
  witness?: Buffer;
  timestamp?: Buffer;
  nVersionGroupId?: Buffer;
  nExpiryHeight?: Buffer;
  extraData?: Buffer;
};
export type CreateTransaction = {
  inputs:
    | Array<[SignerTransaction, number, string | null | undefined, number | null | undefined]>
    | Array<
        [
          SignerTransaction,
          number,
          string | null | undefined,
          number | null | undefined,
          number | null | undefined,
        ]
      >;
  associatedKeysets: string[];
  changePath?: string | undefined;
  outputScriptHex: string;
  lockTime?: number | undefined;
  blockHeight?: number | undefined;
  sigHashType?: number | undefined;
  segwit?: boolean | undefined;
  additionals: Array<string>;
  expiryHeight?: Buffer | undefined;
  useTrustedInputForSegwit?: boolean | undefined;
  onDeviceStreaming?:
    | ((arg: { progress: number; total: number; index: number }) => void)
    | undefined;
  onDeviceSignatureRequested?: (() => void) | undefined;
  onDeviceSignatureGranted?: (() => void) | undefined;
};
