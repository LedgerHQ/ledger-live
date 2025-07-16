import type { MultiversXAccount, MultiversXProvider } from "./types";
import { MultiversXDelegation, MultiversXPreloadData } from "./types";
import { MULTIVERSX_LEDGER_VALIDATOR_ADDRESS } from "./constants";
import { hasMinimumDelegableBalance } from "@ledgerhq/coin-multiversx/helpers/hasMinimumDelegableBalance";

interface AccountBannerHiddenState {
  bannerType: "hidden";
}

interface AccountBannerDelegateState {
  bannerType: "delegate";
}

interface AccountBannerRedelegateState {
  bannerType: "redelegate";
  worstDelegation: MultiversXDelegation;
}

export type AccountBannerState =
  | AccountBannerDelegateState
  | AccountBannerRedelegateState
  | AccountBannerHiddenState;

function getWorstValidator(
  delegations: MultiversXDelegation[],
  validators: MultiversXProvider[],
  ledgerValidator: MultiversXProvider,
) {
  return delegations.reduce((worstValidator, delegation) => {
    const validator = validators.find(validator => validator.contract === delegation.contract);
    if (validator && validator.aprValue < worstValidator.aprValue) {
      return validator;
    }
    return worstValidator;
  }, ledgerValidator);
}

export function getAccountBannerState(
  account: MultiversXAccount,
  multiversxPreloadData: MultiversXPreloadData,
): AccountBannerState {
  const { validators } = multiversxPreloadData;
  const multiversxResources = account.multiversxResources
    ? account.multiversxResources
    : { delegations: [] as MultiversXDelegation[] };

  const hasDelegations = multiversxResources.delegations.length > 0;
  const ledgerValidator = validators.find(
    validator => validator.contract === MULTIVERSX_LEDGER_VALIDATOR_ADDRESS,
  );

  // // if Ledger doesn't provide validator, we don't display banner
  if (!ledgerValidator) {
    return {
      bannerType: "hidden",
    };
  }

  if (hasDelegations) {
    const worstValidator: MultiversXProvider = getWorstValidator(
      multiversxResources.delegations,
      validators,
      ledgerValidator,
    );

    if (worstValidator.contract !== ledgerValidator.contract) {
      const worstDelegation = multiversxResources.delegations.find(
        delegation => delegation.contract === worstValidator.contract,
      );
      if (!worstDelegation) return { bannerType: "hidden" };

      return {
        bannerType: "redelegate",
        worstDelegation,
      };
    }
  }

  if (hasMinimumDelegableBalance(account)) {
    return {
      bannerType: "delegate",
    };
  }

  return {
    bannerType: "hidden",
  };
}
