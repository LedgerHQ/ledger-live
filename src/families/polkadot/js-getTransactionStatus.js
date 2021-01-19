// @flow
import { BigNumber } from "bignumber.js";

import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalanceBecauseDestinationNotCreated,
  FeeNotLoaded,
  NotEnoughSpendableBalance,
} from "@ledgerhq/errors";
import type { Account, TransactionStatus } from "../../types";
import { formatCurrencyUnit } from "../../currencies";

import type { Transaction } from "./types";
import {
  PolkadotUnauthorizedOperation,
  PolkadotElectionClosed,
  PolkadotNotValidator,
  PolkadotLowBondedBalance,
  PolkadotNoUnlockedBalance,
  PolkadotNoNominations,
  PolkadotBondAllFundsWarning,
  PolkadotBondMinimumAmount,
  PolkadotMaxUnbonding,
  PolkadotValidatorsRequired,
} from "./errors";
import { verifyValidatorAddresses } from "./api";
import {
  EXISTENTIAL_DEPOSIT,
  MINIMUM_BOND_AMOUNT,
  isValidAddress,
  isFirstBond,
  isController,
  hasLockedBalance,
  hasMaxUnlockings,
  calculateAmount,
  getMinimalLockedBalance,
  getExistentialDeposit,
} from "./logic";
import { getCurrentPolkadotPreloadData } from "./preload";
import { isControllerAddress, isNewAccount, isElectionClosed } from "./cache";

// Should try to refacto
const getSendTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors = {};
  const warnings = {};

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress("");
  }

  const estimatedFees = t.fees || BigNumber(0);
  const amount = calculateAmount({ a, t });
  const totalSpent = amount.plus(estimatedFees);

  if (amount.lte(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  const existentialDeposit = getExistentialDeposit(a);

  if (
    existentialDeposit.gt(0) &&
    totalSpent.plus(existentialDeposit).gt(a.spendableBalance)
  ) {
    errors.amount = new NotEnoughSpendableBalance(null, {
      minimumAmount: formatCurrencyUnit(
        a.currency.units[0],
        getExistentialDeposit(a),
        {
          disableRounding: true,
          useGrouping: false,
          showCode: true,
        }
      ),
    });
  } else if (totalSpent.gt(a.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (
    !errors.recipient &&
    amount.lt(EXISTENTIAL_DEPOSIT) &&
    (await isNewAccount(t.recipient))
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(
        a.currency.units[0],
        EXISTENTIAL_DEPOSIT,
        { showCode: true }
      ),
    });
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? BigNumber(0) : amount,
    totalSpent,
  });
};

const getTransactionStatus = async (a: Account, t: Transaction) => {
  const errors = {};
  const warnings = {};
  const { staking, validators } = getCurrentPolkadotPreloadData();

  if (t.mode === "send") {
    return await getSendTransactionStatus(a, t);
  }

  if (
    (staking && !staking.electionClosed) || // Preloaded
    (!staking && (await !isElectionClosed())) // Fallback
  ) {
    errors.staking = new PolkadotElectionClosed();
  }

  const amount = calculateAmount({ a, t });

  const unlockingBalance =
    a.polkadotResources?.unlockingBalance || BigNumber(0);

  const unlockedBalance = a.polkadotResources?.unlockedBalance || BigNumber(0);

  const currentBonded =
    a.polkadotResources?.lockedBalance.minus(unlockingBalance) || BigNumber(0);

  switch (t.mode) {
    case "bond":
      if (isFirstBond(a)) {
        // Not a stash yet -> bond method sets the controller
        if (!t.recipient) {
          errors.recipient = new RecipientRequired("");
        } else if (!isValidAddress(t.recipient)) {
          errors.recipient = new InvalidAddress("");
        } else if (await isControllerAddress(t.recipient)) {
          errors.recipient = new PolkadotUnauthorizedOperation(
            "Recipient is already a controller"
          );
        }

        // If not a stash yet, first bond must respect minimum amount of 1 DOT
        if (amount.lt(MINIMUM_BOND_AMOUNT)) {
          errors.amount = new PolkadotBondMinimumAmount("", {
            minimalAmount: formatCurrencyUnit(
              a.currency.units[0],
              MINIMUM_BOND_AMOUNT,
              { showCode: true }
            ),
          });
        }
      } else if (amount.lt(getMinimalLockedBalance(a))) {
        errors.amount = new PolkadotBondMinimumAmount("", {
          minimalAmount: formatCurrencyUnit(
            a.currency.units[0],
            getMinimalLockedBalance(a),
            { showCode: true }
          ),
        });
      }

      if (t.useAllAmount) {
        warnings.amount = new PolkadotBondAllFundsWarning();
      }

      break;

    case "unbond":
      if (!isController(a) || !hasLockedBalance(a)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      }

      if (hasMaxUnlockings(a)) {
        errors.unbondings = new PolkadotMaxUnbonding();
      }

      if (amount.lte(0)) {
        errors.amount = new AmountRequired();
      } else if (
        amount.gt(currentBonded.minus(MINIMUM_BOND_AMOUNT)) &&
        amount.lt(currentBonded)
      ) {
        warnings.amount = new PolkadotLowBondedBalance();
      } else if (amount.gt(currentBonded)) {
        errors.amount = new NotEnoughBalance();
      }
      break;

    case "rebond":
      if (!isController(a)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      }

      if (amount.lte(0)) {
        errors.amount = new AmountRequired();
      } else if (amount.gt(unlockingBalance)) {
        errors.amount = new NotEnoughBalance();
      } else if (amount.lt(getMinimalLockedBalance(a))) {
        errors.amount = new PolkadotBondMinimumAmount("", {
          minimalAmount: formatCurrencyUnit(
            a.currency.units[0],
            getMinimalLockedBalance(a),
            { showCode: true }
          ),
        });
      }
      break;

    case "withdrawUnbonded":
      if (!isController(a)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      }

      if (unlockedBalance.lte(0)) {
        errors.amount = new PolkadotNoUnlockedBalance();
      }

      break;

    case "nominate":
      if (!isController(a)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      } else if (!t.validators || t.validators?.length === 0) {
        errors.staking = new PolkadotValidatorsRequired();
      } else {
        if (validators && validators.length) {
          // Validate directly with preloaded data
          const notValidators = t.validators?.filter(
            (address) => !validators.find((v) => v.address === address)
          );

          if (notValidators && notValidators.length) {
            errors.staking = new PolkadotNotValidator(null, {
              validators: notValidators,
            });
          }
        } else {
          // Fallback with api call
          const notValidators = await verifyValidatorAddresses(
            t.validators || []
          );

          if (notValidators.length) {
            errors.staking = new PolkadotNotValidator(null, {
              validators: notValidators,
            });
            break;
          }
        }
      }
      break;

    case "chill":
      if (!isController(a)) {
        errors.staking = new PolkadotUnauthorizedOperation();
      } else if (!a.polkadotResources?.nominations) {
        errors.staking = new PolkadotNoNominations();
      }
      break;
  }

  const estimatedFees = t.fees || BigNumber(0);

  let totalSpent =
    t.mode === "bond" ? amount.plus(estimatedFees) : estimatedFees;

  if (t.mode === "bond" || t.mode === "unbond" || t.mode === "rebond") {
    if (amount.lte(0)) {
      errors.amount = new AmountRequired();
    }
  }

  if (totalSpent.gt(a.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? BigNumber(0) : amount,
    totalSpent,
  });
};

export default getTransactionStatus;
