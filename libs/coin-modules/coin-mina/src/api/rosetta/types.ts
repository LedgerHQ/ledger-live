export type FetchNetworkStatusResponse = {
  current_block_identifier: {
    index: number;
    hash: string;
  };
  current_block_timestamp: number;
  genesis_block_identifier: {
    index: number;
    hash: string;
  };
  oldest_block_identifier: {
    index: number;
    hash: string;
  };
  sync_status: {
    current_index: number;
    stage: string;
    synced: boolean;
  };
  peers: Array<{
    peer_id: string;
  }>;
};

export type FetchAccountBalanceResponse = {
  block_identifier: {
    index: number;
    hash: string;
  };
  balances: Array<{
    value: string;
    currency: {
      symbol: string;
      decimals: number;
    };
    metadata: {
      locked_balance: number;
      liquid_balance: number;
      total_balance: number;
    };
  }>;
  metadata: {
    created_via_historical_lookup: boolean;
    nonce: string;
  };
};

export type RosettaTransaction = {
  block_identifier: {
    index: number;
    hash: string;
  };
  transaction: {
    transaction_identifier: {
      hash: string;
    };
    operations: Array<{
      operation_identifier: {
        index: number;
      };
      type:
        | "fee_payment"
        | "payment_source_dec"
        | "payment_receiver_inc"
        | "account_creation_fee_via_payment"
        | "zkapp_fee_payer_dec"
        | "delegate_change"
        | "zkapp_balance_update";
      status: "Success" | "Failed";
      account: {
        address: string;
        metadata: {
          token_id: string;
        };
      };
      amount?: {
        value: string;
        currency: {
          symbol: string;
          decimals: number;
        };
      };
      related_operations?: Array<{
        index: number;
      }>;
      metadata?: {
        delegate_change_target?: string;
      };
    }>;
    metadata?: {
      memo?: string;
      nonce?: number;
    };
  };
  timestamp: number;
};

export type FetchAccountTransactionsResponse = {
  transactions: RosettaTransaction[];
  total_count: number;
  next_offset?: number;
};

export type RosettaBlockInfoResponse = {
  block: {
    block_identifier: {
      index: number;
      hash: string;
    };
    parent_block_identifier: {
      index: number;
      hash: string;
    };
    timestamp: number;
  };
};

export type RosettaPreprocessResponse = {
  options: {
    sender: string;
    token_id: string;
    receiver: string;
  };
};

export type RosettaMetadataResponse = {
  metadata: {
    sender: string;
    nonce: string;
    token_id: string;
    receiver: string;
    account_creation_fee?: string;
  };
  suggested_fee: Array<{
    value: string;
    currency: {
      symbol: string;
      decimals: number;
    };
    metadata: {
      minimum_fee: {
        value: string;
        currency: {
          symbol: string;
          decimals: number;
        };
      };
    };
  }>;
};

export type RosettaSubmitResponse = {
  transaction_identifier: {
    hash: string;
  };
};
