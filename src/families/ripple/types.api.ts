interface Currency {
  currency: string;
  amount: string;
}

export interface TxXRPL {
  meta: {
    TransactionResult: string;
    delivered_amount: Currency | string;
  };
  tx: {
    TransactionType: string;
    Fee: string;
    Account: string;
    Destination: string;
    DestinationTag?: number;
    Amount: string;
    Sequence: number;
    date: number;
    inLedger: number;
    hash: string;
  };
}
