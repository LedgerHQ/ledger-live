import type { ElrondAccount, ElrondProvider } from "./types";
import { ElrondDelegation, ElrondPreloadData } from "./types";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "./constants";

type MappedElrondDelegation = ElrondDelegation & {
  validator: ElrondProvider | undefined;
};

interface AccountBannerHiddenState {
  bannerType: "hidden";
}

interface AccountBannerDelegateState {
  bannerType: "delegate";
}

interface AccountBannerRedelegateState {
  bannerType: "redelegate";
  mappedDelegations: MappedElrondDelegation[];
  selectedDelegation: ElrondDelegation;
}

export type AccountBannerState =
  | AccountBannerDelegateState
  | AccountBannerRedelegateState
  | AccountBannerHiddenState;

export function getAccountBannerState(
  account: ElrondAccount,
  elrondPreloadData: ElrondPreloadData
): AccountBannerState {
  const elrondResources = account.elrondResources
    ? account.elrondResources
    : { delegations: [] as ElrondDelegation[] };

  const { validators } = elrondPreloadData;

  const delegationAddresses = elrondResources.delegations.map((delegation) => {
    return delegation.address;
  });

  if (!account.balance.isZero() && delegationAddresses.length === 0) {
    return {
      bannerType: "delegate",
    };
  }

  if (delegationAddresses.length > 0 && account.balance.isZero()) {
    return {
      bannerType: "hidden",
    };
  }

  const ledgerValidator = validators.find(
    (validator) => validator.contract === ELROND_LEDGER_VALIDATOR_ADDRESS
  );

  // // if Ledger doesn't provide validator, we don't display banner
  if (!ledgerValidator) {
    return {
      bannerType: "hidden",
    };
  }

  const findValidator = (validator: string) =>
    elrondPreloadData.validators.find((item) => item.contract === validator);

  const worstValidator: ElrondProvider = delegationAddresses.reduce(
    (worstValidator, validatorAddress) => {
      const validator = validators.find(
        (validator) => validator.contract === validatorAddress
      );
      if (validator && validator.aprValue < worstValidator.aprValue) {
        return validator;
      }
      return worstValidator;
    },
    ledgerValidator
  );

  if (worstValidator.contract !== ledgerValidator.contract) {
    const selectedDelegation = elrondResources.delegations.find(
      (delegation) => delegation.address === worstValidator.contract
    );
    if (!selectedDelegation) return { bannerType: "hidden" };

    return {
      bannerType: "redelegate",
      mappedDelegations: account.elrondResources.delegations.map(
        (delegation: ElrondDelegation) => ({
          ...delegation,
          validator: findValidator(delegation.contract),
        })
      ),
      selectedDelegation,
    };
  } else if (!account.balance.isZero()) {
    return {
      bannerType: "delegate",
    };
  } else {
    return {
      bannerType: "hidden",
    };
  }
}
