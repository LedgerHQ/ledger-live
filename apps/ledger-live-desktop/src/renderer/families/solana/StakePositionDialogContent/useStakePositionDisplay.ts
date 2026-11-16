import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSolanaValidators } from "@ledgerhq/live-common/families/solana/react";
import type {
  SolanaAccount,
  SolanaStakingPosition,
} from "@ledgerhq/live-common/families/solana/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  getDisplayedAmount,
  getExitAmount,
  type StakePositionAmount,
  type StakePositionExitAction,
  type StakePositionSnapshot,
} from "@features/flow-stake-position";
import { useSelector } from "LLD/hooks/redux";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { toStakePositionSnapshot } from "./toStakePositionSnapshot";

export type StakePositionDisplay = Readonly<{
  snapshot: StakePositionSnapshot;
  balance: StakePositionAmount;
  rewards?: StakePositionAmount;
  apy?: string;
  validator: Readonly<{ name: string; imageUrl?: string }>;
  exitAmount: (action: StakePositionExitAction) => StakePositionAmount;
  formatFees: (fees: BigNumber) => string;
}>;

const VALIDATOR_ADDRESS_FORMAT = { prefixLength: 6, suffixLength: 6, separator: "…" };

const toBigNumber = (value: bigint) => new BigNumber(value.toString());

const formatApy = (apy: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(apy);

/** The position as the dialog shows it: amounts in the account unit and the counter value. */
export function useStakePositionDisplay(
  account: SolanaAccount,
  position: SolanaStakingPosition | undefined,
  rewards: string | undefined,
): StakePositionDisplay | null {
  const unit = useAccountUnit(account);
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useDiscreetMode();
  const calculateCountervalue = useCalculateCountervalueCallback();
  const validators = useSolanaValidators(account.currency);
  const { currency } = account;

  return useMemo(() => {
    if (!position) return null;

    const formatCrypto = (value: BigNumber) =>
      formatCurrencyUnit(unit, value, { showCode: true, discreet, locale });
    const formatAmount = (value: BigNumber): StakePositionAmount => {
      const countervalue = calculateCountervalue(currency, value);
      return {
        crypto: formatCrypto(value),
        fiat: countervalue
          ? formatCurrencyUnit(counterValueCurrency.units[0], countervalue, {
              showCode: true,
              discreet,
              locale,
            })
          : undefined,
      };
    };

    const snapshot = toStakePositionSnapshot(position);
    const validator = validators.find(
      ({ voteAccount }) => voteAccount === position.validatorAddress,
    );

    return {
      snapshot,
      balance: formatAmount(toBigNumber(getDisplayedAmount(snapshot))),
      rewards: rewards === undefined ? undefined : formatAmount(new BigNumber(rewards)),
      apy: validator?.apy === undefined ? undefined : formatApy(validator.apy, locale),
      validator: {
        name: validator?.name || formatAddress(position.validatorAddress, VALIDATOR_ADDRESS_FORMAT),
        imageUrl: validator?.avatarUrl,
      },
      exitAmount: action => formatAmount(toBigNumber(getExitAmount(snapshot, action))),
      formatFees: formatCrypto,
    };
  }, [
    calculateCountervalue,
    counterValueCurrency,
    currency,
    discreet,
    locale,
    position,
    rewards,
    unit,
    validators,
  ]);
}
