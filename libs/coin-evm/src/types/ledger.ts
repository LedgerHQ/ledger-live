export type LedgerExplorerERC20TransferEvent = {
  contract: string;
  from: string;
  to: string;
  count: string;
};

export type LedgerExplorerER721TransferEvent = {
  contract: string;
  sender: string;
  receiver: string;
  token_id: string;
};

export type LedgerExplorerER1155TransferEvent = {
  contract: string;
  sender: string;
  operator: string;
  receiver: string;
  transfers: Array<{
    id: string;
    value: string;
  }>;
};

export type LedgerExplorerERC20ApprovalEvent = {
  contract: string;
  owner: string;
  spender: string;
  count: string;
};

export type LedgerExplorerInternalTransaction = {
  from: string;
  to: string;
  input: string | null;
  value: string;
  gas: string | null;
  gas_used: string | null;
  error: string | null;
};

export type LedgerExplorerOperation = {
  hash: string;
  transaction_type: number;
  nonce: string;
  nonce_value: number;
  value: string;
  gas: string;
  gas_price: string;
  max_fee_per_gas: string | null;
  max_priority_fee_per_gas: string | null;
  from: string;
  to: string;
  transfer_events: LedgerExplorerERC20TransferEvent[];
  erc721_transfer_events: LedgerExplorerER721TransferEvent[];
  erc1155_transfer_events: LedgerExplorerER1155TransferEvent[];
  approval_events: LedgerExplorerERC20ApprovalEvent[];
  actions: LedgerExplorerInternalTransaction[];
  confirmations: number;
  input: string | null;
  gas_used: string;
  cumulative_gas_used: string;
  status: number;
  received_at: string;
  block: {
    hash: string;
    height: number;
    time: string;
  };
};
