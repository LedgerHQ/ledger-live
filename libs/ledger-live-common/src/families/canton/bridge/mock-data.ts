type MockTransactionOperation = {
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

const generateMockTransaction = (
  account: string,
  destination: string,
  amount: string,
  fee: string,
  hash: string,
  sequence: number,
  timestamp: number,
  inLedger: number,
): MockTransactionOperation => ({
  meta: {
    delivered_amount: amount,
  },
  tx: {
    Account: account,
    Amount: amount,
    Destination: destination,
    Fee: fee,
    Memo: "",
    Sequence: sequence,
    SigningPubKey: "ED" + account.slice(0, 32),
    TransactionType: "Payment",
    TxnSignature: hash.slice(0, 32),
    date: timestamp,
    hash,
    inLedger,
  },
  validated: true,
});

export const getMockedMethods = (): {
  method: string;
  params: unknown[];
  answer: unknown;
}[] => [
  // Account balance lookup
  {
    method: "getBalance",
    params: ["rLSn6Z3T5uGRdL5jzKLj2rKqRfQMT5JZRG"],
    answer: {
      account_data: {
        Account: "rLSn6Z3T5uGRdL5jzKLj2rKqRfQMT5JZRG",
        Balance: "1000000000",
      },
      ledger_hash: "4BC50C9B0D8515D3EAAE1E74B29A95804346C491EE1A95BF25E4AAB854A6A652",
      ledger_index: 32570,
      validated: true,
      status: "success",
    },
  },

  // Empty account (new account)
  {
    method: "getBalance",
    params: ["rKj2N4jSSB8QMLq3VnvLcZj4QdKhzSkTZW"],
    answer: {
      error: "actNotFound",
    },
  },

  // Account transactions
  {
    method: "getTransactions",
    params: ["rLSn6Z3T5uGRdL5jzKLj2rKqRfQMT5JZRG", { from: 0, size: 100 }],
    answer: [
      generateMockTransaction(
        "rLSn6Z3T5uGRdL5jzKLj2rKqRfQMT5JZRG",
        "rKj2N4jSSB8QMLq3VnvLcZj4QdKhzSkTZW",
        "100000000",
        "10000",
        "E3FE6EA3C48F0C2B639448020EA4F03D4F4F8BDCFDC8882B7B20DBD3A3A5B3A6",
        1,
        Date.now() - 3600000, // 1 hour ago
        32569,
      ),
      generateMockTransaction(
        "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        "rLSn6Z3T5uGRdL5jzKLj2rKqRfQMT5JZRG",
        "200000000",
        "10000",
        "B7FDE3B1D3C2F4A9638448020EA4F03D4F4F8BDCFDC8882B7B20DBD3A3A5B3C8",
        5,
        Date.now() - 7200000, // 2 hours ago
        32568,
      ),
    ],
  },

  // Empty transactions for new account
  {
    method: "getTransactions",
    params: ["rKj2N4jSSB8QMLq3VnvLcZj4QdKhzSkTZW", { from: 0, size: 100 }],
    answer: [],
  },

  // Fee estimation
  {
    method: "estimateFees",
    params: ["12000400020000000000000000"], // sample serialized transaction
    answer: "12000",
  },

  // Transaction submission
  {
    method: "submitTransaction",
    params: ["12000400020000000000000000"], // sample signed transaction
    answer: {
      accepted: true,
      tx_hash: "F4AB442A6D4CBB935D66E1DA7309A5FC71C7143ED4049053EC14E3875B0CF9BF",
    },
  },

  // Network info
  {
    method: "getServerInfo",
    params: [],
    answer: {
      info: {
        complete_ledgers: "32570-32570",
        ledger_index: 32570,
        validated_ledger: {
          hash: "4BC50C9B0D8515D3EAAE1E74B29A95804346C491EE1A95BF25E4AAB854A6A652",
          seq: 32570,
        },
      },
      status: "success",
    },
  },

  // Account sequence number
  {
    method: "getNextValidSequence",
    params: ["rLSn6Z3T5uGRdL5jzKLj2rKqRfQMT5JZRG"],
    answer: 2,
  },

  // New account sequence
  {
    method: "getNextValidSequence",
    params: ["rKj2N4jSSB8QMLq3VnvLcZj4QdKhzSkTZW"],
    answer: 1,
  },

  // Last block
  {
    method: "lastBlock",
    params: [],
    answer: {
      height: 32570,
      hash: "4BC50C9B0D8515D3EAAE1E74B29A95804346C491EE1A95BF25E4AAB854A6A652",
      time: Date.now(),
    },
  },
];
