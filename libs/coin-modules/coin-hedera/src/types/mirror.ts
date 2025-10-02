type FreezeStatus = "NOT_APPLICABLE" | "FROZEN" | "UNFROZEN";

type KycStatus = "NOT_APPLICABLE" | "GRANTED" | "REVOKED";

export interface HederaMirrorCoinTransfer {
  account: string;
  amount: number;
}

export interface HederaMirrorTokenTransfer {
  token_id: string;
  account: string;
  amount: number;
  is_approval?: boolean;
}

export interface HederaMirrorTransaction {
  transfers: HederaMirrorCoinTransfer[];
  token_transfers: HederaMirrorTokenTransfer[];
  charged_tx_fee: number;
  transaction_hash: string;
  consensus_timestamp: string;
  result: string;
  name: string;
  memo_base64?: string;
}

export interface HederaMirrorToken {
  automatic_association: boolean;
  balance: number;
  created_timestamp: string;
  decimals: number;
  token_id: string;
  freeze_status: FreezeStatus;
  kyc_status: KycStatus;
}

export interface HederaMirrorAccount {
  account: string;
  max_automatic_token_associations: number;
  balance: {
    balance: number;
    timestamp: string;
    tokens: {
      token_id: string;
      balance: number;
    }[];
  };
}

export interface HederaMirrorAccountTokensResponse {
  tokens: HederaMirrorToken[];
  links: {
    next: string | null;
  };
}

export interface HederaMirrorAccountsResponse {
  accounts: HederaMirrorAccount[];
  links: {
    next: string | null;
  };
}

export interface HederaMirrorTransactionsResponse {
  transactions: HederaMirrorTransaction[];
  links: {
    next: string | null;
  };
}
