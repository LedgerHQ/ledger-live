import type { CoinDescriptor } from "../../bridge/descriptor";
import { StellarMemoType } from "@ledgerhq/coin-stellar/types/bridge";
import { BigNumber } from "bignumber.js";

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      memo: {
        type: "typed",
        options: StellarMemoType,
        defaultOption: "MEMO_TEXT",
      },
    },
    fees: {
      hasPresets: false,
      hasCustom: true,
      custom: {
        inputs: [
          {
            key: "fees",
            type: "number",
            unitLabel: "stroop",
          },
        ],
        getInitialValues: transaction => {
          const tx = transaction as {
            fees?: BigNumber | null;
            customFees?: { parameters?: { fees?: BigNumber | null } } | null;
            networkInfo?: { fees?: BigNumber } | null;
          };

          const customFees = tx.customFees?.parameters?.fees;
          if (BigNumber.isBigNumber(customFees) && customFees.gt(0)) {
            return { fees: customFees.toFixed() };
          }

          if (BigNumber.isBigNumber(tx.fees) && tx.fees.gt(0)) {
            return { fees: tx.fees.toFixed() };
          }

          const networkFees = tx.networkInfo?.fees;
          return { fees: BigNumber.isBigNumber(networkFees) ? networkFees.toFixed() : "" };
        },
        buildTransactionPatch: values => {
          const fees = new BigNumber(values.fees);
          const normalizedFees =
            fees.isNaN() || fees.isNegative() ? new BigNumber(0) : fees.integerValue();
          return {
            // Keep `fees` for immediate local validation/UI, and set `customFees` so
            // generic-alpaca prepareTransaction preserves user-entered Stellar fees.
            fees: normalizedFees,
            customFees: {
              parameters: {
                fees: normalizedFees,
              },
            },
          };
        },
      },
    },
    errors: {
      userRefusedTransaction: "StellarUserRefusedError",
    },
  },
};
