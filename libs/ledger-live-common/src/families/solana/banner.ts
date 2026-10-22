import { listSolanaStakingPositions, stakeActions } from "@ledgerhq/coin-solana/logic";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { ledgerValidatorsOf } from "@ledgerhq/coin-solana/utils";
import type { SolanaAccount } from "@ledgerhq/coin-solana/types";
import type { ValidatorsAppValidator } from "@ledgerhq/coin-solana/network/validator-app/index";
import type { ResolvedAccountBridge } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../config";

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

  const ledgerVoteAccounts = new Set(
    ledgerValidatorsOf(getCurrencyConfiguration<SolanaCoinConfig>(account.currency.id)).map(
      v => v.voteAccount,
    ),
  );
  const ledgerValidator = validators.find(validator =>
    ledgerVoteAccounts.has(validator.voteAccount),
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
      !ledgerVoteAccounts.has(validatorAdress) &&
      worstValidator.commission <= validator.commission &&
      actions.includes("deactivate");
    if (isValidRedelegation) {
      stakeAccAddr = positionId;
      worstValidator = validator;
    }
  }
  if (worstValidator) {
    if (ledgerVoteAccounts.has(worstValidator.voteAccount)) {
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
