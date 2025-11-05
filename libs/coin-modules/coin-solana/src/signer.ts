import { DeviceModelId } from "@ledgerhq/devices";

export type SolanaAddress = {
  address: Buffer;
};
export type SolanaSignature = {
  signature: Buffer;
};

export type Resolution = {
  deviceModelId?: DeviceModelId | undefined;
  certificateSignatureKind?: "prod" | "test" | undefined;
  tokenAddress?: string;
  tokenInternalId?: string;
  createATA?: {
    address: string;
    mintAddress: string;
  };
  userInputType?: "sol" | "ata";
};

export enum PubKeyDisplayMode {
  LONG,
  SHORT,
}

export type AppConfig = {
  blindSigningEnabled: boolean;
  pubKeyDisplayMode: PubKeyDisplayMode;
  version: string;
};

export interface SolanaSigner {
  getAppConfiguration(): Promise<AppConfig>;
  getAddress(path: string, display?: boolean): Promise<SolanaAddress>;
  signTransaction(
    path: string,
    txBuffer: Buffer,
    resolution?: Resolution,
  ): Promise<SolanaSignature>;
  signMessage(path: string, messageHex: string): Promise<SolanaSignature>;
}
