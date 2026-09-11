import { BigNumber } from "bignumber.js";
import { getCurrentNearPreloadData } from "@ledgerhq/coin-near/preload";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/coin-near/constants";
import { canStake, canUnstake } from "@ledgerhq/coin-near/logic";
import type {
  NearAccount,
  NearStakingPosition,
  NearValidatorItem,
} from "@ledgerhq/coin-near/types";

export interface AccountBannerState {
  display: boolean;
  redelegate: boolean;
  validatorId: string;
  ledgerValidator: NearValidatorItem | undefined;
}

type FrameworkAccount = {
  stakingPositions?: Array<{ state: string; delegate?: string; amount: BigNumber }>;
};

export function getAccountBannerState(account: NearAccount): AccountBannerState {
  const rawPositions = (account as unknown as FrameworkAccount).stakingPositions ?? [];
  const byDelegate = new Map<string, NearStakingPosition>();
  for (const pos of rawPositions) {
    if (!pos.delegate) continue;
    const cur = byDelegate.get(pos.delegate) ?? {
      validatorId: pos.delegate,
      staked: new BigNumber(0),
      available: new BigNumber(0),
      pending: new BigNumber(0),
    };
    if (pos.state === "active") cur.staked = cur.staked.plus(pos.amount);
    else if (pos.state === "deactivating") cur.pending = cur.pending.plus(pos.amount);
    else if (pos.state === "withdrawable") cur.available = cur.available.plus(pos.amount);
    byDelegate.set(pos.delegate, cur);
  }
  const delegations = [...byDelegate.values()];

  // Get ledger validator data
  const { validators } = getCurrentNearPreloadData() ?? {
    validators: [],
  };

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
