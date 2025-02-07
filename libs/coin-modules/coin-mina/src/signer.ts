interface SignTransactionArgs {
  txType: number;
  senderAccount: number;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
  fee: number;
  nonce: number;
  validUntil?: number;
  memo?: string;
  networkId: number;
}
interface BaseLedgerResponse {
  returnCode: string;
  statusText?: string;
  message?: string;
}
interface SignTransactionResponse extends BaseLedgerResponse {
  signature?: string | null;
}

export interface GetAddressResponse extends BaseLedgerResponse {
  publicKey?: string | null;
}
export type MinaSignature = { signature?: string };
export interface MinaSigner {
  getAddress(account?: number, verify?: boolean): Promise<GetAddressResponse>;
  signTransaction(transaction: SignTransactionArgs): Promise<SignTransactionResponse>;
}
