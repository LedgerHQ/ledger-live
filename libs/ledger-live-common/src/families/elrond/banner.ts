import type { ElrondAccount, ElrondProvider } from "./types";
import { ElrondPreloadData } from "./types";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "./constants";

export interface AccountBannerState {
  display: boolean;
  bannerType?: "delegate" | "redelegate";
  validatorSrcAddress?: string;
  ledgerValidator?: ElrondProvider; // todo question: is this type correct?
}

export function getAccountBannerState(
  account: ElrondAccount,
  elrondPreloadData: ElrondPreloadData
): AccountBannerState {
  const elrondResources = account.elrondResources
    ? account.elrondResources
    : { delegations: [], redelegations: [] };

  const { validators } = elrondPreloadData;

  const delegationAddresses = elrondResources.delegations.map((delegation) => {
    return delegation.validatorAddress;
  });

  if (!account.balance.isZero() && delegationAddresses.length === 0) {
    return {
      display: true,
      bannerType: "delegate",
    };
  }

  if (delegationAddresses.length > 0 && account.balance.isZero()) {
    return {
      display: false,
    };
  }

  const ledgerValidator = validators.find(
    (validator) => validator.contract === ELROND_LEDGER_VALIDATOR_ADDRESS
  );

  // // if Ledger doesn't provide validator, we don't display banner: TODO: question, is this still correct? Not in acceptance criteria to hide banner when ledger isn't a validator
  if (!ledgerValidator) {
    return {
      display: false,
    };
  }

  const worstValidator: ElrondProvider = delegationAddresses.reduce(
    (worstValidator, validatorAddress) => {
      const validator = validators.find(
        (validator) => validator.contract === validatorAddress
      );
      if (validator && worstValidator.aprValue < validator.aprValue) {
        return validator;
      }
      return worstValidator;
    },
    ledgerValidator
  );

  if (worstValidator.contract !== ledgerValidator.contract) {
    return {
      display: true,
      bannerType: "redelegate",
    };
  } else {
    return {
      display: true,
      bannerType: "delegate",
    };
  }
}
