import { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import BigNumber from "bignumber.js";

export const MockedTransaction: Transaction = {
  family: "bitcoin",
  amount: new BigNumber(0.00101),
  utxoStrategy: {
    strategy: 0,
    excludeUTXOs: [],
  },
  recipient: "who_knows",
  rbf: true,
  feePerByte: new BigNumber(14),
  networkInfo: {
    family: "bitcoin",
    feeItems: {
      items: [
        {
          key: "0",
          speed: "fast",
          feePerByte: new BigNumber(16),
        },
        {
          key: "1",
          speed: "medium",
          feePerByte: new BigNumber(14),
        },
        {
          key: "2",
          speed: "slow",
          feePerByte: new BigNumber(12),
        },
      ],
      defaultFeePerByte: new BigNumber(14),
    },
  },
  useAllAmount: false,
  feesStrategy: "medium",
};
