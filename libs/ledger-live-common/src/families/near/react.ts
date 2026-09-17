import { useMemo, useState, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/coin-near/constants";
import { mapStakingPositions, getNearStakingPositions } from "@ledgerhq/coin-near/logic";
import {
  NearValidatorItem,
  Transaction,
  NearMappedStakingPosition,
  NearAccount,
  NearStakingPosition,
} from "@ledgerhq/coin-near/types";
import type { NearConfig } from "@ledgerhq/coin-near/config";
import { getAccountCurrency } from "../../account";
import { getCurrencyConfiguration } from "../../config";
import { getCoinModuleApi } from "../../bridge/generic-coin-framework/api";

// The generic-framework bridge never runs families/near/setup.ts (which seeds the legacy
// getCoinConfig() singleton via setCoinConfig), so resolve config directly from LiveConfig
// instead — same source setup.ts itself reads from.
const nearContext = {
  config: () => Promise.resolve(getCurrencyConfiguration<NearConfig>("near")),
  logger: () => {},
};

// Framework writes stakingPositions to accounts with usesStakingPositions: true.
// The type is local to getAccountShape.ts and not exported — access via this cast.
type FrameworkAccount = {
  stakingPositions?: Array<{ state: string; delegate?: string; amount: BigNumber }>;
};

function useNearValidators(): NearValidatorItem[] {
  const [validators, setValidators] = useState<NearValidatorItem[]>([]);
  useEffect(() => {
    let mounted = true;
    getCoinModuleApi("near", "local")
      .then(api => api.getValidators(nearContext))
      .then(page => {
        if (!mounted) return;
        setValidators(
          page.items.map(v => ({
            validatorAddress: v.address,
            commission: v.commissionRate != null ? Number(v.commissionRate) : null,
            tokens: String(v.balance),
          })),
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return validators;
}

export function useNearMappedStakingPositions(account: NearAccount): NearMappedStakingPosition[] {
  const validators = useNearValidators();

  const stakingPositions: NearStakingPosition[] = useMemo(
    () => getNearStakingPositions(account),
    [account],
  );

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

export function getNearBalanceBreakdown(account: NearAccount): {
  stakedBalance: BigNumber;
  storageUsageBalance: BigNumber;
  availableBalance: BigNumber;
  pendingBalance: BigNumber;
} {
  const positions = (account as unknown as FrameworkAccount).stakingPositions;

  // Legacy accounts already carry these as aggregates, including a storage figure the chain
  // reports directly — prefer them over re-deriving from a position list that isn't there.
  // Gated on `undefined` rather than emptiness: under the generic route the field is always
  // written, so an empty array means "nothing staked" and must not resurrect stale aggregates.
  if (positions === undefined && account.nearResources) {
    const { stakedBalance, storageUsageBalance, availableBalance, pendingBalance } =
      account.nearResources;
    return { stakedBalance, storageUsageBalance, availableBalance, pendingBalance };
  }

  const stakedBalance = (positions ?? [])
    .filter(p => p.state === "active")
    .reduce((acc, p) => acc.plus(p.amount), new BigNumber(0));
  const pendingBalance = (positions ?? [])
    .filter(p => p.state === "deactivating")
    .reduce((acc, p) => acc.plus(p.amount), new BigNumber(0));
  const availableBalance = (positions ?? [])
    .filter(p => p.state === "withdrawable")
    .reduce((acc, p) => acc.plus(p.amount), new BigNumber(0));
  const locked = account.balance.minus(account.spendableBalance);
  const nonStorageLocked = stakedBalance.plus(pendingBalance).plus(availableBalance);
  const storageUsageBalance = locked.minus(nonStorageLocked).gt(0)
    ? locked.minus(nonStorageLocked)
    : new BigNumber(0);
  return { stakedBalance, storageUsageBalance, availableBalance, pendingBalance };
}

function reorderValidators(validators: NearValidatorItem[]): NearValidatorItem[] {
  const sortedValidators = [...validators].sort((a, b) =>
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
