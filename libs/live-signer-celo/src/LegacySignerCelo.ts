import Celo from "@ledgerhq/hw-app-celo";
import type Transport from "@ledgerhq/hw-transport";
import { CeloSigner } from "@ledgerhq/coin-celo/signer";
import type { CeloTx, RLPEncodedTx, LegacyEncodedTx } from "@ledgerhq/coin-celo/types";
import { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/services/types";
import { EIP712Message } from "@ledgerhq/types-live";

export class LegacySignerCelo implements CeloSigner {
  private readonly signer: Celo;

  constructor(transport: Transport) {
    this.signer = new Celo(transport);
  }

  setLoadConfig(loadConfig: LoadConfig): void {
    this.signer.setLoadConfig(loadConfig);
  }

  getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean, chainId?: string) {
    return this.signer.getAddress(path, boolDisplay, boolChaincode, chainId);
  }

  signTransaction(path: string, rawTxHex: string) {
    return this.signer.signTransaction(path, rawTxHex);
  }

  signPersonalMessage(path: string, messageHex: string) {
    return this.signer.signPersonalMessage(path, messageHex);
  }

  signEIP712Message(path: string, jsonMessage: EIP712Message, fullImplem?: boolean) {
    return this.signer.signEIP712Message(path, jsonMessage, fullImplem);
  }

  signEIP712HashedMessage(path: string, domainSeparatorHex: string, hashStructMessageHex: string) {
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

  rlpEncodedTxForLedger(txParams: CeloTx): Promise<RLPEncodedTx | LegacyEncodedTx> {
    return this.signer.rlpEncodedTxForLedger(txParams);
  }
}
