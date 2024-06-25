import { BuildTransactionResult, TransferCrossChainTxParams, TransferTxParams } from "hw-app-kda";

export type KadenaAddress = {
  publicKey: Uint8Array;
};

export type KadenaSignature = BuildTransactionResult;

export interface KadenaSigner {
  getPublicKey(path: string): Promise<KadenaAddress>;
  verifyAddress(path: string): Promise<KadenaAddress>;
  signTransferTx(params: TransferTxParams): Promise<KadenaSignature>;
  signTransferCreateTx(params: TransferTxParams): Promise<KadenaSignature>;
  signTransferCrossChainTx(params: TransferCrossChainTxParams): Promise<KadenaSignature>;
}
