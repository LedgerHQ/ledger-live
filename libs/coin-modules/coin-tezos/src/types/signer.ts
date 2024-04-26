export type TezosAddress = {
  address: string;
  publicKey: string;
};
export type TezosSignature = {
  signature: string;
};
// Type coming from hw-app-tezos
export const TezosCurves = {
  ED25519: 0x00,
  SECP256K1: 0x01,
  SECP256R1: 0x02,
};
export type Curve = (typeof TezosCurves)[keyof typeof TezosCurves];

export type LedgerSigner = {
  publicKey(): Promise<string>;
  publicKeyHash(): Promise<string>;
  sign(
    bytes: string,
    watermark?: Uint8Array,
  ): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }>;
  secretKey(): Promise<string | undefined>;
};
export interface TezosSigner {
  getAddress(
    path: string,
    options: {
      verify?: boolean;
      curve?: Curve;
      ins?: number;
    },
  ): Promise<TezosAddress>;
  signOperation(
    path: string,
    rawTxHex: string,
    options: {
      curve?: Curve;
    },
  ): Promise<TezosSignature>;
  // Tezos [LedgerSigner](https://www.npmjs.com/package/@taquito/ledger-signer)
  createLedgerSigner(path: string, prompt: boolean, derivationType: number): LedgerSigner;
}

// export type SignerContext = <T>(
//   deviceId: string,
//   path: string,
//   prompt: boolean,
//   derivationType: number,
//   fn: (signer: TezosSigner) => Promise<T>,
// ) => Promise<T>;
