import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/coin-near/constants";
import { canStake, canUnstake, getNearStakingPositions } from "@ledgerhq/coin-near/logic";
import type { NearAccount, NearValidatorItem } from "@ledgerhq/coin-near/types";

export interface AccountBannerState {
  display: boolean;
  redelegate: boolean;
  validatorId: string;
  ledgerValidator: NearValidatorItem | undefined;
}

/**
 * `validators` is the list the caller loaded for the staking screens (`useNearValidators`); while it
 * is empty, the Ledger validator is unknown and the banner stays hidden.
 */
export function getAccountBannerState(
  account: NearAccount,
  validators: NearValidatorItem[],
): AccountBannerState {
  const delegations = getNearStakingPositions(account);

  const ledgerValidator = validators.find(
    validator => validator.validatorAddress === FIGMENT_NEAR_VALIDATOR_ADDRESS,
  );

  // If Ledger doesn't provide validator, we don't display banner
  if (!ledgerValidator) {
    return {
      display: false,
      redelegate: false,
      validatorId: "",
      ledgerValidator: undefined,
    };
  }

  let redelegate = false;
  let validatorId = "";
  let display = false;

  // Find user current worst validator (default validator is ledger)
  let worstValidator = ledgerValidator;
  for (const delegation of delegations) {
    const validatorAdress = delegation?.validatorId;
    const validator = validators.find(validator => validator.validatorAddress === validatorAdress);
    const isValidRedelegation =
      validator &&
      validatorAdress !== ledgerValidator.validatorAddress &&
      validator.commission &&
      worstValidator.commission &&
      worstValidator?.commission <= validator?.commission &&
      canUnstake(delegation);
    if (isValidRedelegation) {
      validatorId = delegation.validatorId;
      worstValidator = validator;
    }
  }
  if (worstValidator) {
    if (worstValidator?.validatorAddress === ledgerValidator?.validatorAddress) {
      if (canStake(account)) {
        display = true;
      }
    } else {
      redelegate = true;
      display = true;
    }
  }

  return {
    display,
    redelegate,
    validatorId,
    ledgerValidator,
  };
}
