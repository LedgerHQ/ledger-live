import { useEffect, useMemo, useState } from "react";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "@ledgerhq/coin-sui/constants";
import { BigNumber } from "bignumber.js";
import {
  SuiAccount,
  SuiOperationExtra,
  SuiResources,
  SuiStakingExtra,
  SuiValidator,
  MappedStake,
} from "./types";
import { getAccountCurrency } from "../../account";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getCurrentSuiPreloadData } from "@ledgerhq/coin-sui/preload";
import { getStakingExtraByDigest } from "@ledgerhq/coin-sui/getStakingExtraByDigest";
import { OperationType } from "@ledgerhq/types-live";

export function useSuiMappedStakingPositions(account: SuiAccount) {
  const { validators } = getCurrentSuiPreloadData();
  const stakingPositions = account.suiResources?.stakes;

  const unit = getAccountCurrency(account).units[0];

  return useMemo(
    () => mapStakingPositions(stakingPositions ?? [], validators, unit),
    [stakingPositions, validators, unit],
  );
}

/**
 * Resolve `{ amount, address, name }` for the DELEGATE/UNDELEGATE operation-details drawer.
 * Fast path: `op.extra.{validatorAddress, stakedAmount}` (populated at sync by
 * `transactionToOperation`) — synchronous, no network; name from preload. Fallback: ops synced
 * before those fields existed aren't re-fetched by the incremental sync, so recover them by digest
 * on open (held in component state). Returns `{}` for non-staking ops or when nothing resolves
 * (e.g. an optimistic op pre-broadcast), matching the legacy `?? {}` contract.
 */
export function useGetExtraDetails(
  account: SuiAccount,
  type: OperationType,
  digest: string,
): { amount?: string; address?: string; name?: string } {
  const { validators } = getCurrentSuiPreloadData();
  const currencyId = getAccountCurrency(account).id;
  const isStakingOp = type === "DELEGATE" || type === "UNDELEGATE";

  const synced = useMemo<SuiStakingExtra | null>(() => {
    if (!isStakingOp) return null;
    const op = account.operations.find(o => o.hash === digest);
    const extra = op?.extra as SuiOperationExtra | undefined;
    if (!extra?.validatorAddress || !extra?.stakedAmount) return null;
    return { validatorAddress: extra.validatorAddress, stakedAmount: extra.stakedAmount };
  }, [account.operations, digest, isStakingOp]);

  // Keyed by digest so a previous op's fetched value is never shown for the current one.
  const [fetched, setFetched] = useState<{ digest: string; extra: SuiStakingExtra } | null>(null);

  useEffect(() => {
    if (!isStakingOp || synced || fetched?.digest === digest) return;
    let cancelled = false;
    getStakingExtraByDigest(digest, type, currencyId).then(result => {
      if (cancelled || !result) return;
      setFetched({ digest, extra: result });
    });
    return () => {
      cancelled = true;
    };
  }, [isStakingOp, synced, fetched, digest, type, currencyId]);

  return useMemo(() => {
    const resolved = synced ?? (fetched?.digest === digest ? fetched.extra : null);
    if (!resolved) return {};
    // Leave `name` undefined when the validator isn't in preload so the drawers' `?? address`
    // fallback can fire (an empty string would defeat it).
    const name = validators.find(v => v.suiAddress === resolved.validatorAddress)?.name;
    return { amount: resolved.stakedAmount, address: resolved.validatorAddress, name };
  }, [synced, fetched, digest, validators]);
}

export function useLedgerFirstShuffledValidatorsSui(search: string) {
  const { validators: unorderedValidators } = getCurrentSuiPreloadData();
  const validators = reorderValidators(unorderedValidators);
  return useMemo(() => {
    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(
      validator =>
        validator.suiAddress?.toLowerCase().includes(lowercaseSearch) ||
        validator.name.toLowerCase().includes(lowercaseSearch),
    );

    return filtered;
  }, [validators, search]);
}

function reorderValidators(validators: SuiValidator[]): SuiValidator[] {
  const sortedValidators = [...validators].sort((a, b) =>
    new BigNumber(b.stakingPoolSuiBalance).minus(new BigNumber(a.stakingPoolSuiBalance)).toNumber(),
  );

  // move Ledger validator to the first position
  const ledgerValidator = sortedValidators.find(
    v => v.suiAddress === FIGMENT_SUI_VALIDATOR_ADDRESS,
  );

  if (ledgerValidator) {
    const sortedValidatorsLedgerFirst = sortedValidators.filter(
      v => v.suiAddress !== FIGMENT_SUI_VALIDATOR_ADDRESS,
    );
    sortedValidatorsLedgerFirst.unshift(ledgerValidator);

    return sortedValidatorsLedgerFirst;
  }

  return sortedValidators;
}

type Stake = Required<SuiResources>["stakes"];

export const mapStakingPositions = (
  stakingPositions: Stake,
  validators: SuiValidator[],
  unit: Unit,
): MappedStake[] => {
  const data = stakingPositions.flatMap(sp =>
    sp.stakes.map(s => ({ ...s, validatorAddress: sp.validatorAddress })),
  );
  return data.map<MappedStake>(sp => {
    const rank = validators.findIndex(v => v.suiAddress === sp.validatorAddress);
    const validator = validators[rank] ?? sp;
    const formatConfig = {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    };

    return {
      ...sp,
      rank,
      validator,
      stakedSuiId: sp.stakedSuiId,
      formattedAmount: formatCurrencyUnit(unit, BigNumber(sp.principal), formatConfig),
      formattedEstimatedReward: formatCurrencyUnit(
        unit,
        BigNumber(sp.status === "Active" ? sp.estimatedReward : 0),
        formatConfig,
      ),
    };
  });
};
