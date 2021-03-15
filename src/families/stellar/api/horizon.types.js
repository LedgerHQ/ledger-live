//@flow

export type RawAccount = {
  subentry_count: number,
  sequence: number,
};

export type RawOperation = {
  id: string,
  type: string,
  starting_balance: string,
  asset_type: string,
  amount: string,
  transaction_hash: string,
  created_at: string,
  source_account: string,
  transaction_successful: boolean,
  funder?: string,
  from?: string,
  to: string,
  account: string,
};

export type RawTransaction = {
  id: string,
  fee_charged: string,
  ledger_attr: number,
  source_account_sequence: string,
  memo: ?string,
};
