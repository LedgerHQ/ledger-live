import {
  FeeNotLoaded,
  FeeRequired,
  GasLessThanEstimate,
  NotEnoughGas,
  MaxBaseFeeLow,
  MaxBaseFeeHigh,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
} from "@ledgerhq/errors";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { EIP1559ShouldBeUsed, getGasLimit } from "./transaction";
import { Transaction } from "./types";
import { modes } from "./modules";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] =
  (a, t) => {
    const gasLimit = getGasLimit(t);
    let estimatedGasPrice;
    if (EIP1559ShouldBeUsed(a.currency)) {
      estimatedGasPrice = (t.maxBaseFeePerGas || new BigNumber(0)).plus(
        t.maxPriorityFeePerGas
      );
    } else {
      estimatedGasPrice = t.gasPrice;
    }
    const estimatedFees = (estimatedGasPrice || new BigNumber(0)).times(
      gasLimit
    );
    const errors: {
      gasPrice?: Error;
      maxBaseFee?: Error;
      maxPriorityFee?: Error;
      gasLimit?: Error;
      recipient?: Error;
    } = {};
    const warnings: {
      maxBaseFee?: Error;
      maxPriorityFee?: Error;
      gasLimit?: Error;
    } = {};
    const result = {
      errors,
      warnings,
      estimatedFees,
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    };
    const m = modes[t.mode];
    invariant(m, "missing module for mode=" + t.mode);
    m.fillTransactionStatus(a, t, result);

    // generic gas errors and warnings
    if (EIP1559ShouldBeUsed(a.currency)) {
      if (!t.maxBaseFeePerGas) errors.maxBaseFee = new FeeNotLoaded();
      if (!t.maxPriorityFeePerGas) errors.maxPriorityFee = new FeeNotLoaded();
    } else if (!t.gasPrice) {
      errors.gasPrice = new FeeNotLoaded();
    }
    if (gasLimit.eq(0)) {
      errors.gasLimit = new FeeRequired();
    } else if (!errors.recipient) {
      if (estimatedFees.gt(a.balance)) {
        errors.gasPrice = new NotEnoughGas();
      }
    }

    const maxBaseFeeUpperBoundMultiplier = 2;
    if (t.maxBaseFeePerGas) {
      if (t.maxBaseFeePerGas.lt(t.networkInfo.nextBaseFeePerGas)) {
        warnings.maxBaseFee = new MaxBaseFeeLow();
      } else if (
        t.maxBaseFeePerGas.gt(
          t.networkInfo.nextBaseFeePerGas.times(maxBaseFeeUpperBoundMultiplier)
        )
      ) {
        warnings.maxBaseFee = new MaxBaseFeeHigh();
      }
    }

    if (t.maxPriorityFeePerGas) {
      if (t.maxPriorityFeePerGas.lt(t.networkInfo.maxPriorityFeePerGas.min)) {
        warnings.maxPriorityFee = new PriorityFeeTooLow();
      } else if (
        t.maxPriorityFeePerGas.gt(t.networkInfo.maxPriorityFeePerGas.max)
      ) {
        warnings.maxPriorityFee = new PriorityFeeTooHigh();
      }
    }

    if (t.estimatedGasLimit && gasLimit.lt(t.estimatedGasLimit)) {
      warnings.gasLimit = new GasLessThanEstimate();
    }

    return Promise.resolve(result);
  };

export default getTransactionStatus;
