import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceBecauseDestinationNotCreated,
  FeeNotLoaded,
} from "@ledgerhq/errors";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { isValidAddress } from "../common";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";
import polkadotAPI from "../network";
import type { PolkadotAccount, Transaction, TransactionStatus } from "../types";
import {
  PolkadotUnauthorizedOperation,
  PolkadotElectionClosed,
  PolkadotNotValidator,
  PolkadotNoUnlockedBalance,
  PolkadotNoNominations,
  PolkadotAllFundsWarning,
  PolkadotBondMinimumAmount,
  PolkadotBondMinimumAmountWarning,
  PolkadotMaxUnbonding,
  PolkadotValidatorsRequired,
} from "../types";
import { getCurrentPolkadotPreloadData } from "./state";
import {
  EXISTENTIAL_DEPOSIT,
  FEES_SAFETY_BUFFER,
  isFirstBond,
  isController,
  isStash,
  hasLockedBalance,
  hasMaxUnlockings,
  calculateAmount,
  getMinimumAmountToBond,
} from "./utils";

// Should try to refacto
const getSendTransactionStatus: AccountBridge<
  Transaction,
  PolkadotAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  const currency: CryptoCurrency = getCryptoCurrencyById(account.currency.id);

  const estimatedFees = transaction.fees || new BigNumber(0);
  const amount = calculateAmount({
    account,
    transaction,
  });
  const totalSpent = amount.plus(estimatedFees);

  if (amount.lte(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (!(errors.amount instanceof AmountRequired)) {
    if (
      (!transaction.useAllAmount && account.spendableBalance.isZero()) ||
      totalSpent.gt(account.spendableBalance)
    ) {
      errors.amount = new NotEnoughBalance();
    }

    if (
      account.polkadotResources?.lockedBalance.gt(0) &&
      (transaction.useAllAmount ||
        account.spendableBalance.minus(totalSpent).lt(FEES_SAFETY_BUFFER))
    ) {
      warnings.amount = new PolkadotAllFundsWarning();
    }
  }

  if (
    !errors.recipient &&
    amount.lt(EXISTENTIAL_DEPOSIT) &&
    (await polkadotAPI.isNewAccount(transaction.recipient, currency))
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(account.currency.units[0], EXISTENTIAL_DEPOSIT, {
        showCode: true,
      }),
    });
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
    family: transaction.family,
  };
};

export const getTransactionStatus: AccountBridge<
  Transaction,
  PolkadotAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  await loadPolkadotCrypto();

  const errors: {
    staking?: Error;
    amount?: Error;
    recipient?: Error;
    unbondings?: Error;
  } = {};
  const warnings: {
    amount?: Error;
  } = {};
  const preloaded = getCurrentPolkadotPreloadData();
  const { staking, validators } = preloaded;
  const minimumBondBalance = new BigNumber(preloaded.minimumBondBalance);
  const currency: CryptoCurrency = getCryptoCurrencyById(account.currency.id);

  if (transaction.mode === "send") {
    return await getSendTransactionStatus(account, transaction);
  }

  if (
    (staking && !staking.electionClosed) || // Preloaded
    (!staking && !(await polkadotAPI.isElectionClosed(currency))) // Fallback
  ) {
    errors.staking = new PolkadotElectionClosed();
  }

  const amount = calculateAmount({
    account,
    transaction,
  });
  const unlockingBalance = account.polkadotResources?.unlockingBalance || new BigNumber(0);
  const unlockedBalance = account.polkadotResources?.unlockedBalance || new BigNumber(0);
  const currentBonded =
    account.polkadotResources?.lockedBalance.minus(unlockingBalance) || new BigNumber(0);

  const minimumAmountToBond = getMinimumAmountToBond(account, minimumBondBalance);

  switch (transaction.mode) {
    case "bond":
      if (amount.lt(minimumAmountToBond)) {
        errors.amount = new PolkadotBondMinimumAmount("", {
          minimumBondAmount: formatCurrencyUnit(account.currency.units[0], minimumAmountToBond, {
            showCode: true,
          }),
        });
      }

      if (isFirstBond(account)) {
        // Not a stash yet -> bond method sets the controller
        if (!transaction.recipient) {
          errors.recipient = new RecipientRequired("");
        } else if (!isValidAddress(transaction.recipient)) {
          errors.recipient = new InvalidAddress("", {
            currencyName: account.currency.name,
          });
        } else if (await polkadotAPI.isControllerAddress(transaction.recipient, currency)) {
          errors.recipient = new PolkadotUnauthorizedOperation("Recipient is already a controller");
        }
      }

      break;

    case "unbond":
      if (!isController(account) || !hasLockedBalance(account)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      }

      if (hasMaxUnlockings(account)) {
        errors.unbondings = new PolkadotMaxUnbonding();
      }

      if (amount.lte(0)) {
        errors.amount = new AmountRequired();
      } else if (amount.gt(currentBonded.minus(minimumBondBalance)) && amount.lt(currentBonded)) {
        warnings.amount = new PolkadotBondMinimumAmountWarning("", {
          minimumBondBalance: formatCurrencyUnit(account.currency.units[0], minimumBondBalance, {
            showCode: true,
          }),
        });
      } else if (amount.gt(currentBonded)) {
        errors.amount = new NotEnoughBalance();
      }

      break;

    case "rebond":
      if (!isController(account)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      }

      if (amount.lte(0)) {
        errors.amount = new AmountRequired();
      } else if (amount.gt(unlockingBalance)) {
        errors.amount = new NotEnoughBalance();
      } else if (amount.lt(minimumAmountToBond)) {
        warnings.amount = new PolkadotBondMinimumAmountWarning("", {
          minimumBondBalance: formatCurrencyUnit(account.currency.units[0], minimumBondBalance, {
            showCode: true,
          }),
        });
      }

      break;

    case "withdrawUnbonded":
      if (!isController(account)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      }

      if (unlockedBalance.lte(0)) {
        errors.amount = new PolkadotNoUnlockedBalance();
      }

      break;

    case "nominate":
      if (!isController(account)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      } else if (!transaction.validators || transaction.validators?.length === 0) {
        errors.staking = new PolkadotValidatorsRequired();
      } else {
        if (validators && validators.length) {
          // Validate directly with preloaded data
          const notValidators = transaction.validators?.filter(
            address => !validators.find(v => v.address === address),
          );

          if (notValidators && notValidators.length) {
            errors.staking = new PolkadotNotValidator(undefined, {
              validators: notValidators,
            });
          }
        } else {
          // Fallback with api call
          const notValidators = await polkadotAPI.verifyValidatorAddresses(
            transaction.validators || [],
            currency,
          );

          if (notValidators.length) {
            errors.staking = new PolkadotNotValidator(undefined, {
              validators: notValidators,
            });
            break;
          }
        }
      }

      break;

    case "chill":
      if (!isController(account)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      } else if (!account.polkadotResources?.nominations) {
        errors.staking = new PolkadotNoNominations();
      }

      break;

    case "setController":
      if (!isStash(account)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      }
      break;
  }

  const estimatedFees = transaction.fees || new BigNumber(0);
  const totalSpent = transaction.mode === "bond" ? amount.plus(estimatedFees) : estimatedFees;

  if (
    transaction.mode === "bond" ||
    transaction.mode === "unbond" ||
    transaction.mode === "rebond"
  ) {
    if (amount.lte(0)) {
      errors.amount = new AmountRequired();
    }
  }

  if (
    transaction.mode === "bond" &&
    account.spendableBalance.minus(totalSpent).lt(FEES_SAFETY_BUFFER)
  ) {
    errors.amount = new NotEnoughBalance();
  }

  if (!(errors.amount instanceof AmountRequired) && totalSpent.gt(account.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
  };
};

export default getTransactionStatus;
