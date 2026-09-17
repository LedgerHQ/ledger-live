import { getCurrentNearPreloadData } from "@ledgerhq/coin-near/preload";
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
 * `knownValidators` lets the caller supply the list it already fetched through the generic API.
 * The generic bridge never runs `preload()`, so the legacy cache is empty under that route and the
 * banner would never find the Ledger validator; callers on the legacy route can omit the argument
 * and keep reading the preload cache.
 */
export function getAccountBannerState(
  account: NearAccount,
  knownValidators?: NearValidatorItem[],
): AccountBannerState {
  const delegations = getNearStakingPositions(account);

  const validators = knownValidators?.length
    ? knownValidators
    : (getCurrentNearPreloadData()?.validators ?? []);

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
