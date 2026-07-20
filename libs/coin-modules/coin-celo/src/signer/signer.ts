import { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/services/types";
import { EIP712Message } from "@ledgerhq/types-live";

export type CeloAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type CeloSignature = {
  s: string;
  v: string | number;
  r: string;
};

export interface CeloSigner {
  getAddress: (
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean,
    chainId?: string,
  ) => Promise<CeloAddress>;
  signTransaction: (path: string, rawTxHex: string) => Promise<CeloSignature>;
  signPersonalMessage: (path: string, messageHex: string) => Promise<CeloSignature>;
  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem?: boolean,
  ): Promise<CeloSignature>;
  setLoadConfig: (config: LoadConfig) => void;
  clearSignTransaction: (
    path: string,
    rawTxHex: string,
    resolutionConfig: ResolutionConfig,
    throwOnError: boolean,
  ) => Promise<CeloSignature>;
  signEIP712HashedMessage: (
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ) => Promise<CeloSignature>;
}
