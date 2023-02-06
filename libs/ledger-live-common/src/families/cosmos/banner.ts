import { getCurrentCosmosPreloadData } from "./preloadedData";
import { canDelegate, canRedelegate } from "./logic";
import cryptoFactory from "./chain/chain";
import type { CosmosAccount, CosmosValidatorItem } from "./types";

export interface AccountBannerState {
  display: boolean;
  redelegate: boolean;
  validatorSrcAddress: string;
  ledgerValidator: CosmosValidatorItem | undefined;
}

export function getAccountBannerState(
  account: CosmosAccount
): AccountBannerState {
  // Group current validator
  const cosmosResources = account.cosmosResources
    ? account.cosmosResources
    : { delegations: [], redelegations: [] };
  const delegationAddresses = cosmosResources.delegations.map((delegation) => {
    return delegation.validatorAddress;
  });
  const redelegationAddresses = cosmosResources.redelegations.map(
    (redelegation) => {
      return redelegation.validatorDstAddress;
    }
  );
  const validatorAdresses = [...delegationAddresses, ...redelegationAddresses];

  const LEDGER_VALIDATOR_ADDRESS = cryptoFactory(
    account.currency.id
  ).ledgerValidator;
  // Get ledger validator data
  const { validators } = getCurrentCosmosPreloadData()[account.currency.id] ?? {
    validators: [],
  };
  const ledgerValidator = validators.find(
    (validator) => validator.validatorAddress === LEDGER_VALIDATOR_ADDRESS
  );

  // if Ledger doesn't provide validator, we don't display banner
  if (!ledgerValidator) {
    return {
      display: false,
      redelegate: false,
      validatorSrcAddress: "",
      ledgerValidator,
    };
  }

  // Find user current worst validator (default validator is ledger)
  let worstValidator = ledgerValidator;
  for (let i = 0; i < validatorAdresses.length; i++) {
    const validatorAdress = validatorAdresses[i];
    const validator = validators.find(
      (validator) => validator.validatorAddress === validatorAdress
    );
    if (
      validator &&
      worstValidator.commission < validator.commission &&
      canRedelegate(account, validator)
    ) {
      worstValidator = validator;
    }
  }

  let redelegate = false;
  let validatorSrcAddress = "";
  let display = false;

  if (worstValidator?.validatorAddress === ledgerValidator?.validatorAddress) {
    // Not found worst validator than ledger
    if (canDelegate(account)) {
      // Delegate remaining ATOM (not staked)
      display = true;
    }
  } else {
    // Redelegate to the worst validator
    display = true;
    redelegate = true;
    validatorSrcAddress = worstValidator.validatorAddress;
  }

  return {
    display,
    redelegate,
    validatorSrcAddress,
    ledgerValidator,
  };
}
