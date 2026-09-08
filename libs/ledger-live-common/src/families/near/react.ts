import { useMemo, useState, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/coin-near/constants";
import { mapStakingPositions } from "@ledgerhq/coin-near/logic";
import {
  NearValidatorItem,
  Transaction,
  NearMappedStakingPosition,
  NearAccount,
  NearStakingPosition,
} from "@ledgerhq/coin-near/types";
import { createApi as createNearApi } from "@ledgerhq/coin-near/api/index";
import { getCoinConfig } from "@ledgerhq/coin-near/config";
import { getAccountCurrency } from "../../account";

// NearContext = { config: () => Promise<NearConfig> }
const nearContext = { config: () => Promise.resolve(getCoinConfig()) };

// Framework writes stakingPositions to accounts with usesStakingPositions: true.
// The type is local to getAccountShape.ts and not exported — access via this cast.
type FrameworkAccount = {
  stakingPositions?: Array<{ state: string; delegate?: string; amount: BigNumber }>;
};

function useNearValidators(): NearValidatorItem[] {
  const [validators, setValidators] = useState<NearValidatorItem[]>([]);
  useEffect(() => {
    const api = createNearApi();
    api.getValidators(nearContext).then(page => {
      setValidators(
        page.items.map(v => ({
          validatorAddress: v.address,
          commission: v.commissionRate != null ? Number(v.commissionRate) : null,
          tokens: String(v.balance),
        })),
      );
    });
  }, []);
  return validators;
}

export function useNearMappedStakingPositions(account: NearAccount): NearMappedStakingPosition[] {
  const validators = useNearValidators();

  const stakingPositions: NearStakingPosition[] = useMemo(() => {
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
    return [...byDelegate.values()];
  }, [account]);

  const unit = getAccountCurrency(account).units[0];
  return useMemo(
    () => mapStakingPositions(stakingPositions, validators, unit),
    [stakingPositions, validators, unit],
  );
}

export function useNearStakingPositionsQuerySelector(
  account: NearAccount,
  transaction: Transaction,
): {
  options: NearMappedStakingPosition[];
  value: NearMappedStakingPosition | undefined;
} {
  const stakingPositions = useNearMappedStakingPositions(account);
  const options = useMemo<NearMappedStakingPosition[]>(
    () =>
      stakingPositions.filter(sp =>
        transaction.mode === "unstake" ? sp.staked.gt(0) : sp.available.gt(0),
      ),
    [stakingPositions, transaction],
  );

  const selectedValidatorAddress = transaction.recipient;

  const value = useMemo(
    () => stakingPositions.find(({ validatorId }) => validatorId === selectedValidatorAddress),
    [stakingPositions, selectedValidatorAddress],
  );

  return {
    options,
    value,
  };
}

export function useLedgerFirstShuffledValidatorsNear(search: string) {
  const unorderedValidators = useNearValidators();
  const validators = reorderValidators(unorderedValidators);

  return useMemo(() => {
    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    const lowercaseSearch = search.toLowerCase();

    const filtered = validators.filter(validator =>
      validator.validatorAddress?.toLowerCase().includes(lowercaseSearch),
    );

    return filtered;
  }, [validators, search]);
}

export function useNearBalanceBreakdown(account: NearAccount): {
  stakedBalance: BigNumber;
  storageUsageBalance: BigNumber;
  availableBalance: BigNumber;
  pendingBalance: BigNumber;
} {
  const positions = (account as unknown as FrameworkAccount).stakingPositions ?? [];
  const stakedBalance = positions
    .filter(p => p.state === "active")
    .reduce((acc, p) => acc.plus(p.amount), new BigNumber(0));
  const pendingBalance = positions
    .filter(p => p.state === "deactivating")
    .reduce((acc, p) => acc.plus(p.amount), new BigNumber(0));
  const availableBalance = positions
    .filter(p => p.state === "withdrawable")
    .reduce((acc, p) => acc.plus(p.amount), new BigNumber(0));
  const locked = account.balance.minus(account.spendableBalance);
  const storageUsageBalance = locked.minus(stakedBalance).gt(0)
    ? locked.minus(stakedBalance)
    : new BigNumber(0);
  return { stakedBalance, storageUsageBalance, availableBalance, pendingBalance };
}

function reorderValidators(validators: NearValidatorItem[]): NearValidatorItem[] {
  const sortedValidators = validators.sort((a, b) =>
    new BigNumber(b.tokens).minus(new BigNumber(a.tokens)).toNumber(),
  );

  // move Ledger validator to the first position
  const ledgerValidator = sortedValidators.find(
    v => v.validatorAddress === FIGMENT_NEAR_VALIDATOR_ADDRESS,
  );

  if (ledgerValidator) {
    const sortedValidatorsLedgerFirst = sortedValidators.filter(
      v => v.validatorAddress !== FIGMENT_NEAR_VALIDATOR_ADDRESS,
    );
    sortedValidatorsLedgerFirst.unshift(ledgerValidator);

    return sortedValidatorsLedgerFirst;
  }

  return sortedValidators;
}
