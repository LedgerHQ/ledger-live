import { useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import type { HederaCoinConfig } from "@ledgerhq/coin-hedera/config";
import { getCurrencyConfiguration } from "../../config";
import {
  getDelegationStatus,
  filterValidatorBySearchTerm,
  mapMirrorNodesToValidators,
} from "./utils";
import type {
  HederaAccount,
  HederaValidator,
  HederaDelegation,
  HederaEnrichedDelegation,
} from "./types";

// GAP H: the legacy `CurrencyBridge.preload`/`getCurrentHederaPreloadData` singleton this used to
// read is never populated on the generic path — no generic-framework family implements `preload`,
// and the type itself is `@deprecated` in favour of loading data lazily in the UI that needs it.
// `useEvmStakingValidators` (`families/evm/staking/react.ts`) and `useBakers`
// (`families/tezos/react.ts`) are the established precedent: a plain per-render fetch, no singleton.
type ValidatorsFetchState = {
  validators: HederaValidator[];
  loading: boolean;
  error: Error | null;
};

function useHederaAllValidators(currency: CryptoCurrency): ValidatorsFetchState {
  const [state, setState] = useState<ValidatorsFetchState>({
    validators: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ validators: [], loading: true, error: null });

    apiClient
      .getNodes({
        configOrCurrencyId: getCurrencyConfiguration<HederaCoinConfig>(currency.id),
        fetchAllPages: true,
      })
      .then(result => {
        if (cancelled) return;
        setState({
          validators: mapMirrorNodesToValidators(result.nodes),
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState(s => ({
          ...s,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [currency.id]);

  return state;
}

export function useHederaValidators(currency: CryptoCurrency, search?: string): HederaValidator[] {
  const { validators } = useHederaAllValidators(currency);

  return useMemo(() => {
    if (validators.length === 0 || !search || search === "") {
      return validators;
    }

    return validators.filter(validator => {
      return filterValidatorBySearchTerm(validator, search);
    });
  }, [validators, search]);
}

export function useHederaEnrichedDelegation(
  account: HederaAccount,
  delegation: HederaDelegation,
): HederaEnrichedDelegation {
  const validators = useHederaValidators(account.currency);
  const validatorById = new Map(validators.map(v => [v.id, v]));
  const validator = validatorById.get(String(delegation.nodeId)) ?? null;

  return {
    ...delegation,
    status: getDelegationStatus(validator),
    validator: {
      name: validator?.name ?? "",
      address: validator?.address ?? "",
      addressChecksum: validator?.addressChecksum ?? null,
      id: String(delegation.nodeId),
      minStake: validator?.minStake ?? new BigNumber(0),
      maxStake: validator?.maxStake ?? new BigNumber(0),
      activeStake: validator?.activeStake ?? new BigNumber(0),
      activeStakePercentage: validator?.activeStakePercentage ?? new BigNumber(0),
      overstaked: validator?.overstaked ?? false,
    },
  };
}
