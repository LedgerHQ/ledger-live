import { EvmAddress, EvmSignature, EvmSigner } from "@ledgerhq/coin-evm/lib/types/signer";
import Eth from "@ledgerhq/hw-app-eth";
import { EIP712Message } from "@ledgerhq/types-live";
import { ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";

export class LegacySignerEth implements EvmSigner {
  private signer: Eth;

  constructor(transport: any) {
    this.signer = new Eth(transport);
  }
  setLoadConfig() {}

  getAddress(
    path: string,
    boolDisplay?: boolean,
    boolChaincode?: boolean,
    chainId?: string,
  ): Promise<EvmAddress> {
    return this.signer.getAddress(path, boolDisplay, boolChaincode, chainId);
  }

  signTransaction(path: string, rawTxHex: string, resolution?: any): Promise<EvmSignature> {
    return this.signer.signTransaction(path, rawTxHex, resolution);
  }

  signPersonalMessage(path: string, messageHex: string): Promise<EvmSignature> {
    return this.signer.signPersonalMessage(path, messageHex);
  }

  signEIP712Message(
    path: string,
    jsonMessage: EIP712Message,
    fullImplem?: boolean,
  ): Promise<EvmSignature> {
    return this.signer.signEIP712Message(path, jsonMessage, fullImplem);
  }

  signEIP712HashedMessage(
    path: string,
    domainSeparatorHex: string,
    hashStructMessageHex: string,
  ): Promise<EvmSignature> {
    return this.signer.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex);
  }
  clearSignTransaction(
    path: string,
    rawTxHex: string,
    resolutionConfig: ResolutionConfig,
    throwOnError: boolean,
  ) {
    return this.signer.clearSignTransaction(path, rawTxHex, resolutionConfig, throwOnError);
  }
}
