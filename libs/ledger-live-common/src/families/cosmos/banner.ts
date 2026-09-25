import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { getCurrentCosmosPreloadData } from "@ledgerhq/coin-cosmos/preloadedData";
import type { Account } from "@ledgerhq/types-live";
import { canDelegate, canRedelegate } from "./logic";
import { getCosmosResources } from "./types";
import type { CosmosValidatorItem } from "./types";

export interface AccountBannerState {
  display: boolean;
  redelegate: boolean;
  validatorSrcAddress: string;
  ledgerValidator: CosmosValidatorItem | undefined;
}

export function getAccountBannerState(account: Account): AccountBannerState {
  // Group current validator
  const stakingResources = getCosmosResources(account) ?? {
    delegations: [],
    redelegations: [],
  };
  const delegationAddresses = stakingResources.delegations.map(delegation => {
    return delegation.validatorAddress;
  });
  const now = new Date();
  const redelegationAddresses = stakingResources.redelegations
    .filter(redelegation => redelegation.completionDate > now)
    .map(redelegation => redelegation.validatorDstAddress);
  const validatorAdresses = [...delegationAddresses, ...redelegationAddresses];

  const LEDGER_VALIDATOR_ADDRESS = cryptoFactory(account.currency.id).ledgerValidator;
  // Get ledger validator data
  const { validators } = getCurrentCosmosPreloadData()[account.currency.id] ?? {
    validators: [],
  };
  const ledgerValidator = validators.find(
    validator => validator.validatorAddress === LEDGER_VALIDATOR_ADDRESS,
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
    const validator = validators.find(validator => validator.validatorAddress === validatorAdress);
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
