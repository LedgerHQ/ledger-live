import { DeviceModelId } from "@ledgerhq/devices";

export type SolanaAddress = {
  address: Buffer;
};
export type SolanaSignature = {
  signature: Buffer;
};

export type Resolution = {
  deviceModelId?: DeviceModelId | undefined;
  tokenAddress?: string;
  createATA?: {
    address: string;
    mintAddress: string;
  };
};

export interface SolanaSigner {
  getAddress(path: string, display?: boolean): Promise<SolanaAddress>;
  signTransaction(
    path: string,
    txBuffer: Buffer,
    resolution?: Resolution,
  ): Promise<SolanaSignature>;
}
