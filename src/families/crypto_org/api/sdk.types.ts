export const CryptoOrgAccountTransactionTypeEnum = {
  MsgSend: "MsgSend",
  MgsMultiSend: "MsgMultiSend",
};
export const CryptoOrgCurrency = "basecro";
export const CryptoOrgTestnetCurrency = "basetcro";
export interface CryptoOrgAccountTransaction {
  account: string;
  blockHeight: number;
  blockHash: string;
  blockTime: Date;
  hash: string;
  messageTypes: string[];
  success: boolean;
  code: number;
  log: string;
  fee: CryptoOrgAmount[];
  feePayer: string;
  feeGranter: string;
  gasWanted: number;
  gasUsed: number;
  memo: string;
  timeoutHeight: number;
  messages: any[];
}
export interface CryptoOrgAmount {
  denom: string;
  amount: string;
}
export interface CryptoOrgMsgSendContent {
  amount: CryptoOrgAmount[];
  height: number;
  txHash: string;
  msgName: string;
  version: number;
  msgIndex: number;
  name: string;
  uuid: string;
  toAddress: string;
  fromAddress: string;
}
export interface CryptoOrgMsgSend {
  type: string;
  content: CryptoOrgMsgSendContent;
}
