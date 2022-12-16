export interface BlockHeightResponse {
  current_block_identifier: BlockIdentifier;
  current_block_timestamp: number;
  genesis_block_identifier: BlockIdentifier;
  sync_status: Syncstatus;
  peers: any[];
}

interface BlockIdentifier {
  index: number;
  hash: string;
}

export interface GetBalancesResponse {
  block_identifier: BlockIdentifier;
  balances: Balance[];
}

interface Balance {
  value: string;
  currency: Currency;
}

interface Currency {
  symbol: string;
  decimals: number;
}

interface Syncstatus {
  current_index: number;
  target_index: number;
}

export interface GetTxnsHistoryResponse {
  transactions: {
    block_identifier: BlockIdentifier;
    transaction: {
      transaction_identifier: {
        hash: string;
      };
      operations: Operation[];
      metadata: {
        block_height: number;
        memo: number;
        timestamp: number;
      };
    };
  }[];
  total_count: number;
}

interface Operation {
  operation_identifier: {
    index: number;
  };
  type: string;
  status: string;
  account: {
    address: string;
  };
  amount: Balance;
}
