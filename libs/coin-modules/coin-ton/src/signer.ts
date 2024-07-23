import { TonCell, TonTransaction } from "./types";

export type TonAddress = {
  publicKey: Buffer;
  address: string;
};
export type TonSignature = TonCell | undefined;
export interface TonSigner {
  getAddress(
    path: number[],
    opts?: {
      testOnly?: boolean;
      bounceable?: boolean;
      chain?: number;
    },
  ): Promise<{
    address: string;
    publicKey: Buffer;
  }>;
  validateAddress(
    path: number[],
    opts?: {
      testOnly?: boolean;
      bounceable?: boolean;
      chain?: number;
    },
  ): Promise<{
    address: string;
    publicKey: Buffer;
  }>;
  signTransaction: (path: number[], transaction: TonTransaction) => Promise<TonCell>;
}
