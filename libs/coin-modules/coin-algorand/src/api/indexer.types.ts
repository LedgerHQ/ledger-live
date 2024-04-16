import { BigNumber } from "bignumber.js";

export type AlgoTransactionDetails = AlgoPaymentInfo | AlgoAssetTransferInfo;

// Define only types we explicitely support
export enum AlgoTransactionType {
  PAYMENT = "pay",
  ASSET_TRANSFER = "axfer",
}

export interface AlgoTransaction {
  id: string;
  timestamp: string; // 'round-time': 1597933539,
  round: number; // 'confirmed-round': 8575676,
  senderAddress: string; // sender: 'RGX5XA7DWZOZ5SLG4WQSNIFKIG4CNX4VOH23YCEX56523DQEAL3QL56XZM',
  senderRewards: BigNumber; // 'sender-rewards': 0,
  recipientRewards: BigNumber; //'receiver-rewards': 0,
  closeRewards?: BigNumber; // 'close-rewards': 0,
  closeAmount?: BigNumber; //'closing-amount': 0,
  fee: BigNumber;
  note: string;

  type: string; // 'tx-type': 'pay'
  details?: AlgoTransactionDetails;
}

export interface AlgoPaymentInfo {
  amount: BigNumber;
  recipientAddress: string; // receiver
  closeAmount?: BigNumber; // close-amount
  closeToAddress?: string; // close-remainder-to
}

export interface AlgoAssetTransferInfo {
  assetId: string; // asset-id
  assetAmount: BigNumber; // amount
  assetRecipientAddress: string; // receiver
  assetSenderAddress?: string; // sender
  assetCloseAmount?: BigNumber; // close-amount
  assetCloseToAddress?: string; // close-to
}
