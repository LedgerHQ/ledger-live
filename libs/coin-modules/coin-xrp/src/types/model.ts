export type AccountInfo = {
  isNewAccount: boolean;
  balance: string;
  ownerCount: number;
  sequence: number;
};

export type XrpOperation = {
  hash: string;
  address: string;
  type: string;
  simpleType: "IN" | "OUT";
  value: bigint;
  fee: bigint;
  blockHeight: number;
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber: number;
  details?: {
    destinationTag?: number;
    memos?: {
      data?: string;
      format?: string;
      type?: string;
    };
  };
};
