import { useCallback } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  solanaActivationState,
  stakeActions as solanaStakeActions,
  stakeActivePercent,
} from "@ledgerhq/live-common/families/solana/logic";
import { useSolanaStakesWithMeta } from "@ledgerhq/live-common/families/solana/react";
import type {
  SolanaAccount,
  SolanaStakeWithMeta,
  StakeAction,
} from "@ledgerhq/live-common/families/solana/types";
import { getAddressExplorer, getDefaultExplorerView } from "@domain/entity-currency-crypto";
import type {
  AccountDelegationsProps,
  DelegationRow,
  DelegationStatus,
} from "@features/flow-account-detail-delegations";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { discreetModeSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";

const STATE_APPEARANCE = {
  active: "success",
  inactive: "error",
  activating: "warning",
  deactivating: "warning",
} as const satisfies Record<
  ReturnType<typeof solanaActivationState>,
  DelegationStatus["appearance"]
>;

const rowIdOf = ({ stake }: SolanaStakeWithMeta, index: number) =>
  stake.positionId || String(index);

export const useSolanaDelegationsViewModel = (account: SolanaAccount): AccountDelegationsProps => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const discreet = useSelector(discreetModeSelector);
  const unit = useAccountUnit(account);
  const stakesWithMeta = useSolanaStakesWithMeta(account.currency, account.stakingResources);

  const formatAmount = (amount: BigNumber | number) =>
    formatCurrencyUnit(unit, BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount), {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    });

  const goToDelegationFlow = useCallback(
    (delegationAction: object) => {
      navigation.navigate(NavigatorName.SolanaDelegationFlow, {
        screen: ScreenName.DelegationSummary,
        params: { delegationAction, accountId: account.id },
      });
    },
    [account.id, navigation],
  );

  const onSelectRowAction = useCallback(
    (rowId: string, actionId: string) => {
      const stakeWithMeta = stakesWithMeta.find((item, index) => rowIdOf(item, index) === rowId);
      if (!stakeWithMeta) return;
      goToDelegationFlow({
        kind: "change",
        stakeWithMeta,
        stakeAction: actionId as StakeAction,
      });
    },
    [goToDelegationFlow, stakesWithMeta],
  );

  const onOpenValidator = useCallback(
    (rowId: string) => {
      const stakeWithMeta = stakesWithMeta.find((item, index) => rowIdOf(item, index) === rowId);
      if (!stakeWithMeta) return;
      const { meta, stake } = stakeWithMeta;
      const url =
        meta.validator?.url ??
        (stake.validatorAddress &&
          getAddressExplorer(getDefaultExplorerView(account.currency), stake.validatorAddress));
      if (url) Linking.openURL(url);
    },
    [account.currency, stakesWithMeta],
  );

  const onStartDelegating = useCallback(
    () => goToDelegationFlow({ kind: "new" }),
    [goToDelegationFlow],
  );

  const rows: readonly DelegationRow[] = stakesWithMeta.map((stakeWithMeta, index) => {
    const { stake, meta } = stakeWithMeta;
    const activationState = solanaActivationState(stake);
    const withdrawable = stake.withdrawableAmount ?? new BigNumber(0);
    const inactive = stake.inactiveAmount ?? new BigNumber(0);

    return {
      id: rowIdOf(stakeWithMeta, index),
      validator: {
        name: meta.validator?.name || stake.validatorAddress || "-",
        imageUrl: meta.validator?.img,
      },
      status: {
        label: t(`solana.delegation.states.${activationState}`),
        appearance: STATE_APPEARANCE[activationState],
      },
      cells: {
        delegated: {
          value: formatAmount(stake.amount.gt(0) ? stake.amount : withdrawable),
          sensitive: true,
        },
        active: {
          value: `${stake.validatorAddress ? stakeActivePercent(stake).toFixed(2) : "0"} %`,
        },
        ...(inactive.gt(0) ? { inactive: { value: formatAmount(inactive), sensitive: true } } : {}),
        available: { value: formatAmount(withdrawable), sensitive: true },
      },
      actions: solanaStakeActions(stake).map(action => ({
        id: action,
        label: t(`solana.delegation.actions.${action}`),
      })),
    };
  });

  return {
    title: t("account.delegation.sectionLabel"),
    validatorColumnLabel: t("delegation.validator"),
    columns: [
      { id: "delegated", label: t("solana.delegation.totalStake") },
      { id: "active", label: t("solana.delegation.stakeActivePercent") },
      { id: "inactive", label: t("solana.delegation.inactiveStake") },
      { id: "available", label: t("solana.delegation.stakeAvailableBalance") },
    ],
    rows,
    headerActions:
      rows.length > 0 ? [{ id: "delegate", label: t("account.delegation.addDelegation") }] : [],
    emptyState: {
      description: t("solana.delegation.delegationEarn", { name: account.currency.name }),
      learnMoreLabel: t("solana.delegation.info"),
      actionLabel: t("account.delegation.info.cta"),
    },
    discreet,
    rowActionsLabel: t("common.seeMore"),
    openValidatorLabel: t("delegation.validator"),
    onOpenValidator,
    onSelectRowAction,
    onSelectHeaderAction: onStartDelegating,
    onStartDelegating,
    onLearnMore: () => Linking.openURL(urls.solana.stakingPage),
    testID: "account-detail-solana-delegations",
  };
};
