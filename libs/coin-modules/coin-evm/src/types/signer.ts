import { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { EIP712Message } from "@ledgerhq/types-live";

export type EvmAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type EvmSignature = {
  s: string;
  v: string | number;
  r: string;
};

export interface EvmSigner {
  getAddress: (
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean,
    chainId?: string,
  ) => Promise<EvmAddress>;
  signTransaction: (path: string, rawTxHex: string, resolution?: any) => Promise<EvmSignature>;
  signPersonalMessage: (path: string, messageHex: string) => Promise<EvmSignature>;
  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem?: boolean,
  ): Promise<EvmSignature>;
  setLoadConfig: (config: LoadConfig) => void;
  clearSignTransaction: (
    path: string,
    rawTxHex: string,
    resolutionConfig: ResolutionConfig,
    throwOnError: boolean,
  ) => Promise<EvmSignature>;
  signEIP712HashedMessage: (
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ) => Promise<EvmSignature>;
}
