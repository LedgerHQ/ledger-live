export type TezosAddress = {
  address: string;
  publicKey: string;
};
export type TezosSignature = {
  signature: string;
};
// Type coming from hw-app-tezos
type TezosCurves = {
  ED25519: 0x00;
  SECP256K1: 0x01;
  SECP256R1: 0x02;
};
export type Curve = TezosCurves[keyof TezosCurves];

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
}
