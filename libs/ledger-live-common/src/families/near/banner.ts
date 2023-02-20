import { getCurrentNearPreloadData } from "./preload";
import { canStake, canUnstake, FIGMENT_NEAR_VALIDATOR_ADDRESS } from "./logic";
import type { NearAccount, NearValidatorItem } from "./types";

export interface AccountBannerState {
  display: boolean;
  redelegate: boolean;
  validatorId: string;
  ledgerValidator: NearValidatorItem | undefined;
}

export function getAccountBannerState(
  account: NearAccount
): AccountBannerState {
  // Group current validator
  const nearResources = account.nearResources
    ? account.nearResources
    : { stakingPositions: [] };

  const delegations = nearResources?.stakingPositions.map((delegation) => {
    return delegation;
  });

  // Get ledger validator data
  const { validators } = getCurrentNearPreloadData() ?? {
    validators: [],
  };

  const ledgerValidator = validators.find(
    (validator) => validator.validatorAddress === FIGMENT_NEAR_VALIDATOR_ADDRESS
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
    const validator = validators.find(
      (validator) => validator.validatorAddress === validatorAdress
    );
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
    if (
      worstValidator?.validatorAddress === ledgerValidator?.validatorAddress
    ) {
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
