export type HgraphResponse<Data> =
  | {
      data: Data;
    }
  | {
      errors: {
        message: string;
        extensions?: Record<string, unknown>;
      }[];
    };

export interface LatestIndexedConsensusTimestamp {
  consensus_timestamp: number;
}

export interface ERC20TokenAccount {
  token_id: number;
  balance: number;
  balance_timestamp: number;
  created_timestamp: number;
}

export interface ERC20TokenTransfer {
  token_id: number;
  token_evm_address: string;
  sender_evm_address: string;
  sender_account_id: number | null;
  receiver_evm_address: string;
  receiver_account_id: number | null;
  payer_account_id: number;
  amount: number;
  transfer_type: string;
  consensus_timestamp: number;
  transaction_hash: string;
}

export type HgraphLatestIndexedConsensusTimestampResponse = HgraphResponse<{
  ethereum_transaction: LatestIndexedConsensusTimestamp[];
}>;

export type HgraphErcTokenAccountResponse = HgraphResponse<{
  erc_token_account: ERC20TokenAccount[];
}>;

export type HgraphErcTokenTransferResponse = HgraphResponse<{
  erc_token_transfer: ERC20TokenTransfer[];
}>;
