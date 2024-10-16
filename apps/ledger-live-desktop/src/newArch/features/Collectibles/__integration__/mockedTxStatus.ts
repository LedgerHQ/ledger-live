import { TransactionStatus } from "@ledgerhq/live-common/families/bitcoin/types";
import BigNumber from "bignumber.js";

type Props = {
  withErrors?: boolean;
};

export const getMockedTxStatus = ({ withErrors }: Props): TransactionStatus => ({
  errors: withErrors
    ? {
        amount: {
          message: "AmountRequired",
          name: "AmountRequired",
        },
      }
    : {},
  warnings: {},
  estimatedFees: new BigNumber(1342),
  amount: new BigNumber(0.0002),
  totalSpent: new BigNumber(1),
  txInputs: [
    {
      address: "who_knows",
      value: new BigNumber(134322),
      previousTxHash: "who_knows",
      previousOutputIndex: 1,
    },
  ],
  txOutputs: [
    {
      outputIndex: 0,
      blockHeight: 700000,
      address: "who_knows",
      isChange: true,
      value: new BigNumber(23832),
      hash: "",
      rbf: true,
    },
  ],
  opReturnData: "",
});
