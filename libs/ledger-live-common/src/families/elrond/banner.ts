import type { ElrondAccount, ElrondProvider } from "./types";
import { ElrondDelegation, ElrondPreloadData } from "./types";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "./constants";
import { areEarnRewardsEnabled } from "./helpers/areEarnRewardsEnabled";

interface AccountBannerHiddenState {
  bannerType: "hidden";
}

interface AccountBannerDelegateState {
  bannerType: "delegate";
}

interface AccountBannerRedelegateState {
  bannerType: "redelegate";
  worstDelegation: ElrondDelegation;
}

export type AccountBannerState =
  | AccountBannerDelegateState
  | AccountBannerRedelegateState
  | AccountBannerHiddenState;

function getWorstValidator(
  delegations: ElrondDelegation[],
  validators: ElrondProvider[],
  ledgerValidator: ElrondProvider
) {
  return delegations.reduce((worstValidator, delegation) => {
    const validator = validators.find(
      (validator) => validator.contract === delegation.contract
    );
    if (validator && validator.aprValue < worstValidator.aprValue) {
      return validator;
    }
    return worstValidator;
  }, ledgerValidator);
}

export function getAccountBannerState(
  account: ElrondAccount,
  elrondPreloadData: ElrondPreloadData
): AccountBannerState {
  const { validators } = elrondPreloadData;
  const elrondResources = account.elrondResources
    ? account.elrondResources
    : { delegations: [] as ElrondDelegation[] };

  const hasDelegations = elrondResources.delegations.length > 0;
  const ledgerValidator = validators.find(
    (validator) => validator.contract === ELROND_LEDGER_VALIDATOR_ADDRESS
  );

  // // if Ledger doesn't provide validator, we don't display banner
  if (!ledgerValidator) {
    return {
      bannerType: "hidden",
    };
  }

  if (hasDelegations) {
    const worstValidator: ElrondProvider = getWorstValidator(
      elrondResources.delegations,
      validators,
      ledgerValidator
    );

    if (worstValidator.contract !== ledgerValidator.contract) {
      const worstDelegation = elrondResources.delegations.find(
        (delegation) => delegation.contract === worstValidator.contract
      );
      if (!worstDelegation) return { bannerType: "hidden" };

      return {
        bannerType: "redelegate",
        worstDelegation,
      };
    }
  }

  if (areEarnRewardsEnabled(account)) {
    return {
      bannerType: "delegate",
    };
  }

  return {
    bannerType: "hidden",
  };
}
