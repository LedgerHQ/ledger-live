import { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { EIP712Message } from "@ledgerhq/types-live";
import { Observable } from "rxjs";

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

export type EvmSignerEventType =
  | "signer.evm.loading-context"
  | "signer.evm.signing"
  | "signer.evm.signed";

export type EvmSignerEvent =
  | {
      type: Exclude<EvmSignerEventType, "signer.evm.signed">;
    }
  | {
      type: "signer.evm.signed";
      value: EvmSignature;
    };

export interface EvmSigner {
  getAddress: (
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean,
    chainId?: string,
  ) => Promise<EvmAddress>;
  signTransaction: (path: string, rawTxHex: string, resolution?: any) => Observable<EvmSignerEvent>;
  signPersonalMessage: (path: string, messageHex: string) => Observable<EvmSignerEvent>;
  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem?: boolean,
  ): Observable<EvmSignerEvent>;
  setLoadConfig: (config: LoadConfig) => void;
  clearSignTransaction: (
    path: string,
    rawTxHex: string,
    resolutionConfig: ResolutionConfig,
    throwOnError: boolean,
  ) => Observable<EvmSignerEvent>;
  signEIP712HashedMessage: (
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ) => Observable<EvmSignerEvent>;
}
