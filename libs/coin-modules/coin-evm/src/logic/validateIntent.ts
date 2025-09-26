import BigNumber from "bignumber.js";
import type {
  AssetInfo,
  Balance,
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-framework/api/types";
import {
  AmountRequired,
  ETHAddressNonEIP,
  FeeNotLoaded,
  FeeTooHigh,
  GasLessThanEstimate,
  InvalidAddress,
  MaxFeeTooLow,
  NotEnoughBalance,
  NotEnoughGas,
  PriorityFeeHigherThanMaxFee,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  RecipientRequired,
} from "@ledgerhq/errors";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getFeesUnit } from "@ledgerhq/coin-framework/account/helpers";
import { isNative, TransactionTypes } from "../types";
import { DEFAULT_GAS_LIMIT, isEthAddress } from "../utils";
import { getGasTracker } from "../network/gasTracker";
import estimateFees from "./estimateFees";
import getBalance from "./getBalance";
import {
  getTransactionType,
  isApiGasOptions,
  isEip1559FeeEstimation,
  isEip55Address,
  isLegacyFeeEstimation,
} from "./common";

function assetsAreEqual(asset1: AssetInfo, asset2: AssetInfo): boolean {
  if (asset1.type !== asset2.type) return false;

  if ("assetReference" in asset1 && "assetReference" in asset2) {
    return asset1.assetReference === asset2.assetReference;
  }

  return asset1.type === "native";
}

function findBalance(asset: AssetInfo, balances: Balance[]): Balance {
  return balances.find(b => assetsAreEqual(b.asset, asset)) ?? { asset, value: 0n };
}

/**
 * Validate the amount of a transaction for an account
 */
async function validateAmount(
  balance: Balance,
  amount: bigint,
  totalSpent: bigint,
): Promise<Pick<TransactionValidation, "errors" | "warnings">> {
  if (!amount) {
    return { errors: { amount: new AmountRequired() }, warnings: {} };
  }

  if (totalSpent > balance.value) {
    return { errors: { amount: new NotEnoughBalance() }, warnings: {} };
  }

  return { errors: {}, warnings: {} };
}

/**
 * If sending ETH, warn if fees are more than 10% of the amount
 */
function validateFeeRatio(
  asset: AssetInfo,
  amount: bigint,
  estimatedFees: FeeEstimation,
): Pick<TransactionValidation, "errors" | "warnings"> {
  if (isNative(asset) && amount > 0n && 10n * estimatedFees.value > amount) {
    return { errors: {}, warnings: { feeTooHigh: new FeeTooHigh() } };
  }

  return { errors: {}, warnings: {} };
}

/**
 * Validate an address for a transaction
 */
function validateRecipient(
  currency: CryptoCurrency,
  intent: TransactionIntent,
): Pick<TransactionValidation, "errors" | "warnings"> {
  if (!intent.recipient) {
    return { errors: { recipient: new RecipientRequired() }, warnings: {} };
  }

  if (!isEthAddress(intent.recipient)) {
    return {
      errors: {
        recipient: new InvalidAddress("", {
          currencyName: currency.name,
        }),
      },
      warnings: {},
    };
  }

  // Check if address is respecting EIP-55
  if (!isEip55Address(intent.recipient)) {
    return { errors: {}, warnings: { recipient: new ETHAddressNonEIP() } }; // "Auto-verification not available: carefully verify the address"
  }

  return { errors: {}, warnings: {} };
}

/**
 * Validate gas properties of a transaction, depending on its type and the account emitter
 */
async function validateGas(
  currency: CryptoCurrency,
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: FeeEstimation,
): Promise<Pick<TransactionValidation, "errors" | "warnings">> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const nativeBalance = findBalance({ type: "native" }, balances);

  const gasLimit =
    typeof estimatedFees.parameters?.gasLimit === "bigint" ? estimatedFees.parameters.gasLimit : 0n;
  const customGasLimit =
    typeof estimatedFees.parameters?.customGasLimit === "bigint" &&
    estimatedFees.parameters.customGasLimit;

  // Gas Limit
  if (typeof customGasLimit === "bigint") {
    if (customGasLimit === 0n) {
      errors.gasLimit = new FeeNotLoaded();
    } else if (customGasLimit < BigInt(DEFAULT_GAS_LIMIT.toFixed(0))) {
      errors.gasLimit = new GasLessThanEstimate();
    }
  } else {
    if (gasLimit === 0n) {
      errors.gasLimit = new FeeNotLoaded();
    } else if (gasLimit < BigInt(DEFAULT_GAS_LIMIT.toFixed(0))) {
      errors.gasLimit = new GasLessThanEstimate();
    }
  }

  if (typeof customGasLimit === "bigint" && customGasLimit < gasLimit) {
    warnings.gasLimit = new GasLessThanEstimate();
  }

  const transactionType = getTransactionType(intent.type);
  const hasLegacyGasPrice =
    transactionType === TransactionTypes.legacy && isLegacyFeeEstimation(estimatedFees);
  const hasEip1559GasPrice =
    transactionType === TransactionTypes.eip1559 && isEip1559FeeEstimation(estimatedFees);

  // Gas Price
  if (!(hasLegacyGasPrice || hasEip1559GasPrice)) {
    errors.gasPrice = new FeeNotLoaded();
  } else if (intent.recipient && estimatedFees.value > nativeBalance.value) {
    errors.gasPrice = new NotEnoughGas(undefined, {
      // "You need {{fees}} {{ticker}} for network fees to swap as you are on {{cryptoName}} network. <link0>Buy {{ticker}}</link0>"
      fees: formatCurrencyUnit(
        getFeesUnit(currency),
        new BigNumber(estimatedFees.value.toString()),
      ),
      ticker: currency.ticker,
      cryptoName: currency.name,
      links: ["ledgerlive://buy"],
    });
  }

  // eip1559 specific
  if (transactionType === TransactionTypes.eip1559 && isEip1559FeeEstimation(estimatedFees)) {
    const { maxFeePerGas, maxPriorityFeePerGas, gasOptions } = estimatedFees.parameters;
    const { maximalPriorityFee, minimalPriorityFee, recommendedNextBaseFee } = await (async (
      options: unknown,
    ): Promise<{
      maximalPriorityFee: bigint;
      minimalPriorityFee: bigint;
      recommendedNextBaseFee: bigint;
    }> => {
      if (isApiGasOptions(options)) {
        const maximalPriorityFee = options.fast.maxPriorityFeePerGas;
        const minimalPriorityFee = options.slow.maxPriorityFeePerGas;
        const recommendedNextBaseFee = options.medium.nextBaseFee;

        if (
          typeof maximalPriorityFee === "bigint" &&
          typeof minimalPriorityFee === "bigint" &&
          typeof recommendedNextBaseFee === "bigint"
        ) {
          return { maximalPriorityFee, minimalPriorityFee, recommendedNextBaseFee };
        }
      }

      const gasTracker = getGasTracker(currency);
      const gasOptions = await gasTracker?.getGasOptions({
        currency,
        options: { useEIP1559: true },
      });

      return {
        maximalPriorityFee: BigInt(gasOptions?.fast?.maxPriorityFeePerGas?.toFixed(0) ?? "0"),
        minimalPriorityFee: BigInt(gasOptions?.slow?.maxPriorityFeePerGas?.toFixed(0) ?? "0"),
        recommendedNextBaseFee: BigInt(gasOptions?.medium?.nextBaseFee?.toFixed(0) ?? "0"),
      };
    })(gasOptions);

    if (maxPriorityFeePerGas === 0n) {
      errors.maxPriorityFee = new PriorityFeeTooLow();
    } else if (maxPriorityFeePerGas > maxFeePerGas) {
      // priority fee is more than max fee (total fee for the transaction) which doesn't make sense
      errors.maxPriorityFee = new PriorityFeeHigherThanMaxFee();
    }

    if (maximalPriorityFee && maxPriorityFeePerGas > maximalPriorityFee) {
      warnings.maxPriorityFee = new PriorityFeeTooHigh();
    } else if (minimalPriorityFee && maxPriorityFeePerGas < minimalPriorityFee) {
      warnings.maxPriorityFee = new PriorityFeeTooLow();
    }

    if (recommendedNextBaseFee && maxFeePerGas < recommendedNextBaseFee) {
      warnings.maxFee = new MaxFeeTooLow();
    }
  }

  return { errors, warnings };
}

function computeAmount(
  intent: TransactionIntent,
  estimatedFees: FeeEstimation,
  balance: Balance,
): bigint {
  if (!intent.useAllAmount) return intent.amount;

  return isNative(intent.asset) ? balance.value - estimatedFees.value : balance.value;
}

export async function validateIntent(
  currency: CryptoCurrency,
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const estimatedFees = customFees ?? (await estimateFees(currency, intent));
  const balances = await getBalance(currency, intent.sender);
  const balance = findBalance(intent.asset, balances);
  const amount = computeAmount(intent, estimatedFees, balance);
  const totalSpent = isNative(intent.asset) ? amount + estimatedFees.value : amount;

  const { errors: recipientErr, warnings: recipientWarn } = validateRecipient(currency, intent);
  const { errors: amountErr, warnings: amountWarn } = await validateAmount(
    balance,
    amount,
    totalSpent,
  );
  const { errors: gasErr, warnings: gasWarn } = await validateGas(
    currency,
    intent,
    balances,
    estimatedFees,
  );
  const { errors: feeRatioErr, warnings: feeRatioWarn } = validateFeeRatio(
    intent.asset,
    amount,
    estimatedFees,
  );

  const errors = {
    ...recipientErr,
    ...amountErr,
    ...gasErr,
    ...feeRatioErr,
  };
  const warnings = {
    ...recipientWarn,
    ...amountWarn,
    ...gasWarn,
    ...feeRatioWarn,
  };

  return {
    errors,
    warnings,
    estimatedFees: estimatedFees.value,
    totalSpent,
    amount,
  };
}
