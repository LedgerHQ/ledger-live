import {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
  Balance,
} from "@ledgerhq/coin-framework/api/types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { fetchAccountNetworkInfo, getRecipientAccount } from "../network";
import { fetchAccount } from "../network/horizon";
import { BASE_RESERVE, MIN_BALANCE } from "../network/serialization";
import {
  StellarAssetNotAccepted,
  StellarAssetNotFound,
  StellarAssetRequired,
  StellarFeeSmallerThanBase,
  StellarFeeSmallerThanRecommended,
  StellarMemo,
  StellarMuxedAccountNotExist,
  StellarNotEnoughNativeBalance,
  StellarNotEnoughNativeBalanceToAddTrustline,
  StellarSourceHasMultiSign,
  StellarWrongMemoFormat,
} from "../types";
import { isAccountMultiSign, isAddressValid } from "./utils";
import { validateMemo } from "./validateMemo";

export const validateIntent = async (
  transactionIntent: TransactionIntent<StellarMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transactionIntent.useAllAmount;

  const destinationNotExistMessage = new NotEnoughBalanceBecauseDestinationNotCreated("", {
    minimalAmount: `${MIN_BALANCE} XLM`,
  });

  const { spendableBalance, balance } = await fetchAccount(transactionIntent.sender);
  const networkInfo = await fetchAccountNetworkInfo(transactionIntent.sender);

  const estimatedFees = customFees?.value ?? 0n;
  const baseReserve = networkInfo.baseReserve
    ? BigInt(Math.round(networkInfo.baseReserve.toNumber() * 10)) / 10n
    : 0n;
  const isAssetPayment = transactionIntent.asset.type !== "native";
  const nativeBalance = BigInt(balance.toString());
  const nativeAmountAvailable = BigInt(spendableBalance.toString()) - estimatedFees;
  let amount = 0n;
  let maxAmount = 0n;
  let totalSpent = 0n;

  // Enough native balance to cover transaction (with required reserve + fees)
  if (!errors.amount && nativeAmountAvailable < 0) {
    errors.amount = new StellarNotEnoughNativeBalance();
  }

  const networkInfoBaseFee = BigInt(networkInfo.baseFee.toString() || "0");
  const networkFees = BigInt(networkInfo.fees.toString() || "0");
  // Entered fee is smaller than base fee
  if (estimatedFees < networkInfoBaseFee) {
    errors.transaction = new StellarFeeSmallerThanBase();
    // Entered fee is smaller than recommended
  } else if (estimatedFees < networkFees) {
    warnings.transaction = new StellarFeeSmallerThanRecommended();
  }

  // Operation specific checks
  if (transactionIntent.type === "changeTrust") {
    // Check asset provided
    if (
      transactionIntent.asset.type !== "native" &&
      (("assetReference" in transactionIntent.asset && !transactionIntent.asset.assetReference) ||
        ("assetOwner" in transactionIntent.asset && !transactionIntent.asset.assetOwner))
    ) {
      // This is unlikely
      errors.transaction = new StellarAssetRequired("");
    }

    // Has enough native balance to add new trustline
    // NOTE: need to do this as BASE_RESERVE is 0.5
    const SCALE = 10n;
    const scaledNative = nativeAmountAvailable * SCALE;
    const scaledBaseReserve = BigInt(BASE_RESERVE * 10); // = 5n

    if (scaledNative - scaledBaseReserve < 0n) {
      errors.amount = new StellarNotEnoughNativeBalanceToAddTrustline();
    }
  } else {
    // Payment
    // Check recipient address
    if (!transactionIntent.recipient) {
      errors.recipient = new RecipientRequired("");
    } else if (!isAddressValid(transactionIntent.recipient)) {
      errors.recipient = new InvalidAddress("", {
        currencyName: transactionIntent.asset.name ?? "", // NOTE: before account.currencyName,
      });
    } else if (transactionIntent.sender === transactionIntent.recipient) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    const recipientAccount = await getRecipientAccount({
      recipient: transactionIntent.recipient,
    });

    // Check recipient account
    if (!recipientAccount?.id && !errors.recipient && !warnings.recipient) {
      if (recipientAccount?.isMuxedAccount) {
        errors.recipient = new StellarMuxedAccountNotExist();
      } else {
        if (isAssetPayment) {
          errors.recipient = destinationNotExistMessage;
        } else {
          warnings.recipient = destinationNotExistMessage;
        }
      }
    }

    // Asset payment
    if (isAssetPayment) {
      const asset = transactionIntent.asset;
      if (asset.type === "native" || (!("assetReference" in asset) && !("assetOwner" in asset))) {
        throw new StellarAssetNotFound();
      }

      // Check recipient account accepts asset
      if (
        recipientAccount?.id &&
        !errors.recipient &&
        !warnings.recipient &&
        !recipientAccount.assetIds.includes(`${asset.assetReference}:${asset.assetOwner}`)
      ) {
        errors.recipient = new StellarAssetNotAccepted("", {
          assetCode: asset.assetReference,
        });
      }

      const assetBalance = balances.find(
        b =>
          b.asset.type !== "native" &&
          "assetReference" in b.asset &&
          b.asset.assetReference === asset.assetReference &&
          "assetOwner" in b.asset &&
          b.asset.assetOwner === asset.assetOwner,
      );

      if (!assetBalance) {
        // This is unlikely
        throw new StellarAssetNotFound();
      }
      const assetSpendableBalance = assetBalance.value - (assetBalance?.locked || 0n);

      maxAmount = assetSpendableBalance || assetBalance.value;
      amount = useAllAmount ? maxAmount : transactionIntent.amount;
      totalSpent = amount;

      if (!errors.amount && amount > assetBalance.value) {
        errors.amount = new NotEnoughBalance();
      }
    } else {
      // Native payment
      maxAmount = nativeAmountAvailable;
      amount = useAllAmount ? maxAmount : transactionIntent.amount ?? 0n;

      if (amount > maxAmount) {
        errors.amount = new NotEnoughBalance();
      }

      totalSpent = useAllAmount ? nativeAmountAvailable : amount + estimatedFees;

      // Need to send at least 1 XLM to create an account
      if (!errors.recipient && !recipientAccount?.id && !errors.amount && amount < 10000000n) {
        errors.amount = destinationNotExistMessage;
      }
      if (totalSpent > nativeBalance - baseReserve) {
        errors.amount = new NotEnoughSpendableBalance(undefined, {
          minimumAmount: transactionIntent.asset.unit
            ? formatCurrencyUnit(
                transactionIntent.asset.unit,
                new BigNumber(baseReserve.toString()),
                {
                  disableRounding: true,
                  showCode: true,
                },
              )
            : "Unknown unit",
        });
      }

      if (!errors.recipient && !errors.amount && (amount < 0n || totalSpent > nativeBalance)) {
        errors.amount = new NotEnoughBalance();
        totalSpent = 0n;
        amount = 0n;
      }
    }

    if (amount === 0n) {
      errors.amount = new AmountRequired();
    }
  }

  if (await isAccountMultiSign(transactionIntent.sender)) {
    errors.recipient = new StellarSourceHasMultiSign();
  }

  if (
    transactionIntent?.memo?.type !== "NO_MEMO" &&
    !validateMemo(transactionIntent?.memo?.value, transactionIntent?.memo?.type)
  ) {
    errors.transaction = new StellarWrongMemoFormat();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

export default validateIntent;
