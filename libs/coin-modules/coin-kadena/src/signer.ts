import {
  BuildTransactionResult,
  TransferCrossChainTxParams,
  TransferTxParams,
} from "./ledger-kadena-js/Kadena";

export interface KadenaAddress {
  pubkey: Buffer;
  address: string;
}

export type KadenaSignature = BuildTransactionResult;

export interface KadenaSigner {
  signTransferTx(path: string, params: TransferTxParams): Promise<KadenaSignature>;
  signTransferCreateTx(path: string, params: TransferTxParams): Promise<KadenaSignature>;
  signTransferCrossChainTx(
    path: string,
    params: TransferCrossChainTxParams,
  ): Promise<KadenaSignature>;
  getAddressAndPubKey(path: string, showAddrInDevice?: boolean): Promise<KadenaAddress>;
}
