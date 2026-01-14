export type ConcordiumOperation = {
  meta: {
    delivered_amount: string;
  };
  tx: {
    Account: string;
    Amount: string;
    Destination: string;
    Fee: string;
    Memo: string;
    Sequence: number;
    SigningPubKey: string;
    TransactionType: string;
    TxnSignature: string;
    date: number;
    hash: string;
    inLedger: number;
  };
  validated: boolean;
};

export type ResponseStatus =
  | { status: string; error?: never }
  | {
      status?: never;
      error: string;
    };
export function isResponseStatus(obj: object): obj is ResponseStatus {
  return "status" in obj || "error" in obj;
}

export type NewAccount = "NewAccount";
export type AccountInfoResponse = {
  account_data: {
    Account: string;
    Balance: string;
  };
  ledger_hash: string;
  ledger_index: number;
  validated: boolean;
} & ResponseStatus;

export type SubmitReponse = {
  accepted: boolean;
  tx_hash: string;
};

export type AccountTxResponse = {
  account: string;
  transactions: ConcordiumOperation[];
} & ResponseStatus;
