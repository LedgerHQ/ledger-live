import {
  FeeNotLoaded,
  FeeRequired,
  GasLessThanEstimate,
  MaxFeeLowerThanPriorityFee,
  NotEnoughGas,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  MaxFeeTooLow,
} from "@ledgerhq/errors";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { EIP1559ShouldBeUsed, getGasLimit } from "./transaction";
import { Transaction } from "./types";
import { modes } from "./modules";
import { getEnv } from "../../env";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] =
  (account, tx) => {
    const gasLimit = getGasLimit(tx);
    const estimatedGasPrice = (() => {
      if (EIP1559ShouldBeUsed(account.currency)) {
        return tx.maxFeePerGas || new BigNumber(0);
      }
      return tx.gasPrice;
    })();
    const estimatedFees = (estimatedGasPrice || new BigNumber(0)).times(
      gasLimit
    );

    const errors: {
      gasPrice?: Error;
      maxFee?: Error;
      maxPriorityFee?: Error;
      gasLimit?: Error;
      recipient?: Error;
    } = {};
    const warnings: {
      maxFee?: Error;
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

    const mode = modes[tx.mode];
    invariant(mode, "missing module for mode=" + tx.mode);
    mode.fillTransactionStatus(account, tx, result);

    // generic gas errors and warnings
    if (EIP1559ShouldBeUsed(account.currency)) {
      if (!tx.maxFeePerGas || tx.maxFeePerGas.isEqualTo(0)) {
        errors.maxFee = new FeeNotLoaded();
      }

      if (!tx.maxPriorityFeePerGas || tx.maxPriorityFeePerGas.isEqualTo(0)) {
        errors.maxPriorityFee = new FeeNotLoaded();
      }

      if (tx.maxPriorityFeePerGas?.isGreaterThan(tx.maxFeePerGas || 0)) {
        errors.maxPriorityFee = new MaxFeeLowerThanPriorityFee();
      }
    } else if (!tx.gasPrice) {
      errors.gasPrice = new FeeNotLoaded();
    }

    if (gasLimit.eq(0)) {
      errors.gasLimit = new FeeRequired();
    } else if (!errors.recipient) {
      if (estimatedFees.gt(account.balance)) {
        errors.gasPrice = new NotEnoughGas();
      }
    }

    if (tx.maxPriorityFeePerGas) {
      // Don't send a transaction with a priority fee more than X % (default is 15%) inferior to network conditions
      // With a low enough priority fee, your transaction might get stuck forever since you can't cancel or boost tx in the live
      if (
        getEnv("EIP1559_MINIMUM_FEES_GATE") &&
        tx.maxPriorityFeePerGas.lt(
          tx?.networkInfo?.maxPriorityFeePerGas?.min?.times(
            getEnv("EIP1559_PRIORITY_FEE_LOWER_GATE")
          ) || 0
        )
      ) {
        errors.maxPriorityFee = new PriorityFeeTooLow();
      } else if (
        tx.maxPriorityFeePerGas.gt(
          tx?.networkInfo?.maxPriorityFeePerGas?.max || 0
        )
      ) {
        warnings.maxPriorityFee = new PriorityFeeTooHigh();
      }
    }

    if (tx.maxFeePerGas) {
      if (
        tx.networkInfo?.nextBaseFeePerGas &&
        tx.maxFeePerGas.lt(
          tx.networkInfo.nextBaseFeePerGas.plus(
            tx.networkInfo.maxPriorityFeePerGas?.min || 0
          )
        )
      ) {
        warnings.maxFee = new MaxFeeTooLow();
      }
    }

    if (tx.estimatedGasLimit && gasLimit.lt(tx.estimatedGasLimit)) {
      warnings.gasLimit = new GasLessThanEstimate();
    }

    return Promise.resolve(result);
  };

export default getTransactionStatus;
