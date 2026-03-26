import type { FeeDescriptor } from "../../../bridge/descriptor/types";
import { BigNumber } from "bignumber.js";

export const fees: FeeDescriptor = {
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
      const feesVal = new BigNumber(values.fees);
      const normalizedFees =
        feesVal.isNaN() || feesVal.isNegative() ? new BigNumber(0) : feesVal.integerValue();
      return {
        fees: normalizedFees,
        customFees: {
          parameters: {
            fees: normalizedFees,
          },
        },
      };
    },
  },
};
