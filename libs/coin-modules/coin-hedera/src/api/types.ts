interface HederaMirrorTransfer {
  account: string;
  amount: number;
}

export interface HederaMirrorTransaction {
  transfers: HederaMirrorTransfer[];
  charged_tx_fee: string;
  transaction_hash: string;
  consensus_timestamp: string;
  transaction_id: string;
}

export interface HederaMirrorAccount {
  account: string;
  balance: {
    balance: number;
    timestamp: string;
  };
}
