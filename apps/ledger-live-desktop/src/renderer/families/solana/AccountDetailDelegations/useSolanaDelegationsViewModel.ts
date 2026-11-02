import { useCallback } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
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
} from "@ledgerhq/live-common/families/solana/types";
import { getAddressExplorer, getDefaultExplorerView } from "@domain/entity-currency-crypto";
import type {
  AccountDelegationsProps,
  DelegationRow,
  DelegationStatus,
} from "@features/flow-account-detail-delegations";
import { useDispatch } from "LLD/hooks/redux";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";

type DelegateModalName =
  | "MODAL_SOLANA_DELEGATION_ACTIVATE"
  | "MODAL_SOLANA_DELEGATION_DEACTIVATE"
  | "MODAL_SOLANA_DELEGATION_REACTIVATE"
  | "MODAL_SOLANA_DELEGATION_WITHDRAW";

const ACTION_MODALS: Readonly<Record<string, DelegateModalName>> = {
  activate: "MODAL_SOLANA_DELEGATION_ACTIVATE",
  reactivate: "MODAL_SOLANA_DELEGATION_REACTIVATE",
  deactivate: "MODAL_SOLANA_DELEGATION_DEACTIVATE",
  withdraw: "MODAL_SOLANA_DELEGATION_WITHDRAW",
};

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

export const useSolanaDelegationsViewModel = (
  account: SolanaAccount,
): AccountDelegationsProps | undefined => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const discreet = useDiscreetMode();
  const unit = useAccountUnit(account);
  const stakesWithMeta = useSolanaStakesWithMeta(account.currency, account.stakingResources);
  const explorerView = getDefaultExplorerView(account.currency);
  const ledgerValidatorUrl = useLocalizedUrl(urls.ledgerValidator);

  const formatAmount = (amount: BigNumber | number) =>
    formatCurrencyUnit(unit, BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount), {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    });

  const onSelectRowAction = useCallback(
    (rowId: string, actionId: string) => {
      const stakeWithMeta = stakesWithMeta.find((item, index) => rowIdOf(item, index) === rowId);
      if (stakeWithMeta)
        dispatch(openModal(actionId as DelegateModalName, { account, stakeWithMeta }));
    },
    [account, dispatch, stakesWithMeta],
  );

  const onOpenValidator = useCallback(
    (rowId: string) => {
      const stakeWithMeta = stakesWithMeta.find((item, index) => rowIdOf(item, index) === rowId);
      if (!stakeWithMeta) return;
      const { meta, stake } = stakeWithMeta;
      const url =
        meta.validator?.url ??
        (stake.validatorAddress &&
          explorerView &&
          getAddressExplorer(explorerView, stake.validatorAddress));
      if (url) openURL(url === urls.ledgerValidator ? ledgerValidatorUrl : url);
    },
    [explorerView, ledgerValidatorUrl, stakesWithMeta],
  );

  const onSelectHeaderAction = useCallback(() => {
    dispatch(openModal("MODAL_SOLANA_DELEGATE", { account }));
  }, [account, dispatch]);

  const onStartDelegating = useCallback(() => {
    dispatch(openModal("MODAL_SOLANA_REWARDS_INFO", { account }));
  }, [account, dispatch]);

  const hasStakes = stakesWithMeta.length > 0;
  if (!hasStakes && !account.spendableBalance.gt(0)) return undefined;

  const rows: readonly DelegationRow[] = stakesWithMeta.map((stakeWithMeta, index) => {
    const { stake, meta } = stakeWithMeta;
    const activationState = solanaActivationState(stake);

    return {
      id: rowIdOf(stakeWithMeta, index),
      validator: {
        name: meta.validator?.name || stake.validatorAddress || "-",
        imageUrl: meta.validator?.img,
      },
      status: {
        label: t(`solana.delegation.states.${activationState}`),
        appearance: STATE_APPEARANCE[activationState],
        tooltip: t(
          activationState === "active"
            ? "solana.delegation.activeTooltip"
            : "solana.delegation.inactiveTooltip",
        ),
      },
      cells: {
        delegated: { value: formatAmount(stake.amount), sensitive: true },
        active: {
          value: `${stake.validatorAddress ? stakeActivePercent(stake).toFixed(2) : "0"} %`,
        },
        available: {
          value: formatAmount(stake.withdrawableAmount ?? new BigNumber(0)),
          sensitive: true,
        },
      },
      actions: solanaStakeActions(stake).map(action => {
        const modal = ACTION_MODALS[action];
        if (!modal) throw new Error(`unsupported stake action: ${action}`);
        return { id: modal, label: t(`solana.delegation.${action}.flow.title`) };
      }),
    };
  });

  return {
    title: t("solana.delegation.listHeader"),
    validatorColumnLabel: t("delegation.validator"),
    statusColumnLabel: t("delegation.status"),
    columns: [
      { id: "delegated", label: t("delegation.delegated") },
      { id: "active", label: t("solana.delegation.active") },
      { id: "available", label: t("solana.delegation.availableBalance") },
    ],
    rows,
    headerActions: hasStakes ? [{ id: "delegate", label: t("solana.delegation.delegate") }] : [],
    emptyState: {
      description: t("solana.delegation.emptyState.description", { name: account.currency.name }),
      learnMoreLabel: t("solana.delegation.emptyState.info"),
      actionLabel: t("solana.delegation.emptyState.delegation"),
    },
    discreet,
    rowActionsLabel: t("common.manage"),
    onOpenValidator,
    onSelectRowAction,
    onSelectHeaderAction,
    onStartDelegating,
    onLearnMore: () => openURL(urls.solana.staking),
    testID: "account-detail-solana-delegations",
  };
};
