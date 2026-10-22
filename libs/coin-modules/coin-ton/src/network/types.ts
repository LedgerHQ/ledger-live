import type {
  TonAddressBook,
  TonFee,
  TonJettonTransfer,
  TonJettonWallet,
  TonResponseAccountInfo,
  TonResponseEstimateFee,
  TonResponseMessage,
  TonResponseWalletInfo,
  TonTransaction,
  TonTransactionsList,
} from "../bridge/bridgeHelpers/api.types";

export type {
  TonAddressBook,
  TonFee,
  TonJettonWallet,
  TonResponseAccountInfo,
  TonResponseEstimateFee,
  TonResponseMessage,
  TonResponseWalletInfo,
  TonTransaction,
  TonTransactionsList,
};

export type TonMasterchainBlock = {
  seqno: number;
  root_hash: string;
  gen_utime: string;
};

export type TonResponseMasterchainInfo = {
  last: TonMasterchainBlock;
};

export type TonResponseBlocks = {
  blocks: TonMasterchainBlock[];
};

export type TonJettonTransferRow = TonJettonTransfer & {
  trace_id: string;
  transaction_aborted: boolean;
};

export type TonJettonTransfersList = {
  jetton_transfers: TonJettonTransferRow[];
  address_book: TonAddressBook;
};

export type TonResponseJettonWallets = {
  jetton_wallets: TonJettonWallet[];
};

export type TonTraceNode = {
  tx_hash: string;
  in_msg_hash: string;
  children?: TonTraceNode[];
};

export type TonTrace = {
  trace_id: string;
  trace: TonTraceNode;
  transactions: Record<string, Pick<TonTransaction, "account" | "hash" | "mc_block_seqno">>;
};

export type TonResponseTraces = {
  traces: TonTrace[];
};

/** Both `utime` bounds are inclusive. */
export type TonHistoryWindow = {
  startUtime?: number | undefined;
  endUtime?: number | undefined;
  limit: number;
  sort: "asc" | "desc";
};
