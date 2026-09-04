import { listSolanaStakingPositions, stakeActions } from "@ledgerhq/coin-solana/logic";
import { LEDGER_VALIDATORS_VOTE_ACCOUNTS } from "@ledgerhq/coin-solana/utils";
import type { SolanaAccount } from "@ledgerhq/coin-solana/types";
import type { ValidatorsAppValidator } from "@ledgerhq/coin-solana/network/validator-app/index";
import type { ResolvedAccountBridge } from "@ledgerhq/types-live";

export interface AccountBannerState {
  display: boolean;
  redelegate: boolean;
  stakeAccAddr: string;
  ledgerValidator: ValidatorsAppValidator | undefined;
}

export function getAccountBannerState(
  account: SolanaAccount,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridge: ResolvedAccountBridge<any>,
  validators: ValidatorsAppValidator[],
): AccountBannerState {
  // Group current validator
  const delegations = listSolanaStakingPositions(account.stakingResources);

  const ledgerValidator = validators.find(validator =>
    LEDGER_VALIDATORS_VOTE_ACCOUNTS.includes(validator.voteAccount),
  );

  // If Ledger doesn't provide validator, we don't display banner
  if (!ledgerValidator) {
    return {
      display: false,
      redelegate: false,
      stakeAccAddr: "",
      ledgerValidator,
    };
  }

  let redelegate = false;
  let stakeAccAddr = "";
  let display = false;

  // Find user current worst validator (default validator is ledger)
  let worstValidator = ledgerValidator;
  for (const delegation of delegations) {
    const validatorAdress = delegation.validatorAddress;
    const validator = validators.find(validator => validator.voteAccount === validatorAdress);
    const actions = stakeActions(delegation);
    const positionId = delegation.positionId;
    const isValidRedelegation =
      positionId &&
      validator &&
      validatorAdress &&
      !LEDGER_VALIDATORS_VOTE_ACCOUNTS.includes(validatorAdress) &&
      worstValidator.commission <= validator.commission &&
      actions.includes("deactivate");
    if (isValidRedelegation) {
      stakeAccAddr = positionId;
      worstValidator = validator;
    }
  }
  if (worstValidator) {
    if (LEDGER_VALIDATORS_VOTE_ACCOUNTS.includes(worstValidator?.voteAccount)) {
      if (!bridge.isAccountEmpty(account)) {
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
    stakeAccAddr,
    ledgerValidator,
  };
}
