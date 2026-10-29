import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  formatVotes,
  getLastVotedDate,
  getNextRewardDate,
  useTronSuperRepresentatives,
} from "@ledgerhq/live-common/families/tron/react";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { getAddressExplorer, getDefaultExplorerView } from "@domain/entity-currency-crypto";
import type { AccountDelegationsProps } from "@features/flow-account-detail-delegations";
import { track } from "@shared/analytics";
import { useSelector } from "LLD/hooks/redux";
import { urls } from "~/config/urls";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useDateFromNow } from "~/renderer/hooks/useDateFormatter";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { localeSelector } from "~/renderer/reducers/settings";
import { stakeDefaultTrack } from "~/renderer/screens/stake/constants";
import { getAccountUrl } from "~/renderer/utils";

const STAKEKIT_PATH = "/platform/stakekit";
const YIELD_ID = "tron-trx-native-staking";
const DAY_MS = 1000 * 60 * 60 * 24;

type PendingAction = "REVOTE" | "CLAIM_REWARDS";
type HeaderActionId = "vote" | "claim";

type Translate = ReturnType<typeof useTranslation>["t"];
type HeaderAction = NonNullable<AccountDelegationsProps["headerActions"]>[number];

const claimDisabledReason = (
  t: Translate,
  { hasRewards, formattedNextRewardDate }: { hasRewards: boolean; formattedNextRewardDate: string },
) =>
  hasRewards && formattedNextRewardDate
    ? t("tron.voting.nextRewardsDate", { date: formattedNextRewardDate })
    : t("tron.voting.noRewards");

const buildRows = (
  t: Translate,
  {
    votes,
    tronPower,
    durationDays,
  }: { votes: ReturnType<typeof formatVotes>; tronPower: number; durationDays: number },
): AccountDelegationsProps["rows"] =>
  votes.map(({ name, address, voteCount }) => ({
    id: address,
    validator: { name: name ?? address },
    cells: {
      amount: { value: String(voteCount), sensitive: true },
      percentTP: {
        value: `${Math.round(100 * Number((voteCount * 1e2) / tronPower)) / 100} %`,
      },
      duration: {
        value: durationDays
          ? t("delegation.durationDays", { count: durationDays })
          : t("delegation.durationJustStarted"),
      },
    },
    actions: [],
  }));

type HeaderActionsInput = {
  showVotes: boolean;
  hasVotes: boolean;
  hasRewards: boolean;
  canClaimRewards: boolean;
  formattedReward: string;
  formattedNextRewardDate: string;
};

const buildHeaderActions = (
  t: Translate,
  {
    showVotes,
    hasVotes,
    hasRewards,
    canClaimRewards,
    formattedReward,
    ...rest
  }: HeaderActionsInput,
): HeaderAction[] => {
  const actions: HeaderAction[] = [];
  if (showVotes) {
    actions.push({
      id: "vote" satisfies HeaderActionId,
      label: t(hasVotes ? "tron.voting.emptyState.voteExisting" : "tron.voting.emptyState.vote"),
    });
  }
  if (hasVotes || canClaimRewards) {
    actions.push({
      id: "claim" satisfies HeaderActionId,
      label: t(hasRewards ? "tron.voting.claimAvailableRewards" : "tron.voting.claimRewards", {
        amount: formattedReward,
      }),
      disabledReason: canClaimRewards ? undefined : claimDisabledReason(t, { hasRewards, ...rest }),
    });
  }
  return actions;
};

const buildFooter = (
  t: Translate,
  {
    showVotes,
    tronPower,
    totalVotesUsed,
    discreet,
  }: { showVotes: boolean; tronPower: number; totalVotesUsed: number; discreet: boolean },
): AccountDelegationsProps["footer"] => {
  const percentVotesUsed = Math.floor(100 * (totalVotesUsed / tronPower)) / 100;
  if (!showVotes || percentVotesUsed >= 1) return undefined;
  return {
    title: t("tron.voting.remainingVotes.title", {
      amount: discreet ? "***" : tronPower - totalVotesUsed,
    }),
    description: t("tron.voting.remainingVotes.description"),
    actionLabel: t("tron.voting.remainingVotes.button"),
    actionDisabled: true,
  };
};

export const useTronDelegationsViewModel = (account: TronAccount): AccountDelegationsProps => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = useSelector(localeSelector);
  const discreet = useDiscreetMode();
  const unit = useAccountUnit(account);
  const superRepresentatives = useTronSuperRepresentatives();
  const stakingUrl = useLocalizedUrl(urls.stakingTron);
  const explorerView = getDefaultExplorerView(account.currency);

  const { votes, tronPower, unwithdrawnReward } = account.tronResources;
  const formattedVotes = formatVotes(votes, superRepresentatives);
  const totalVotesUsed = votes.reduce((sum, { voteCount }) => sum + voteCount, 0);
  const hasVotes = formattedVotes.length > 0;
  const hasRewards = unwithdrawnReward.gt(0);
  const showVotes = tronPower > 0 && hasVotes;

  const lastVoteDate = getLastVotedDate(account);
  const durationDays = useMemo(
    () => (lastVoteDate ? Math.floor((Date.now() - lastVoteDate.getTime()) / DAY_MS) : 0),
    [lastVoteDate],
  );

  const nextRewardDate = getNextRewardDate(account);
  const nextRewardDay = useMemo(
    () => (nextRewardDate ? new Date(nextRewardDate) : undefined),
    [nextRewardDate],
  );
  const formattedNextRewardDate = useDateFromNow(nextRewardDay);
  const canClaimRewards = hasRewards && !formattedNextRewardDate;

  const formattedReward = formatCurrencyUnit(unit, BigNumber(unwithdrawnReward || 0), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  const goToStakekit = useCallback(
    (pendingaction: PendingAction, button: string) => {
      track("button_clicked2", {
        ...stakeDefaultTrack,
        delegation: "stake",
        page: "Page Account",
        button,
        provider: "Stakekit",
        currency: "TRX",
      });
      navigate(STAKEKIT_PATH, {
        state: {
          pendingaction,
          yieldId: YIELD_ID,
          accountId: account.id,
          returnTo: getAccountUrl(account.id),
        },
      });
    },
    [account.id, navigate],
  );

  const onSelectHeaderAction = useCallback(
    (actionId: string) => {
      if (actionId === ("vote" satisfies HeaderActionId)) goToStakekit("REVOTE", "manage votes");
      if (actionId === ("claim" satisfies HeaderActionId)) {
        goToStakekit("CLAIM_REWARDS", "claim rewards");
      }
    },
    [goToStakekit],
  );

  const onOpenValidator = useCallback(
    (address: string) => {
      const url = explorerView && getAddressExplorer(explorerView, address);
      if (url) openURL(url);
    },
    [explorerView],
  );

  const rows = showVotes ? buildRows(t, { votes: formattedVotes, tronPower, durationDays }) : [];
  const headerActions = buildHeaderActions(t, {
    showVotes,
    hasVotes,
    hasRewards,
    canClaimRewards,
    formattedReward,
    formattedNextRewardDate,
  });
  const footer = buildFooter(t, { showVotes, tronPower, totalVotesUsed, discreet });

  return {
    title: t("tron.voting.header"),
    validatorColumnLabel: t("delegation.validator"),
    columns: [
      { id: "amount", label: t("delegation.amount") },
      { id: "percentTP", label: t("tron.voting.percentageTP") },
      { id: "duration", label: t("delegation.duration") },
    ],
    rows,
    headerActions,
    emptyState: {
      description: t(
        tronPower > 0 ? "tron.voting.emptyState.votesDesc" : "tron.voting.emptyState.description",
        { name: account.currency.name },
      ),
      learnMoreLabel: t("tron.voting.emptyState.info"),
      actionLabel: t(tronPower > 0 ? "tron.voting.emptyState.vote" : "delegation.title"),
      actionDisabled: true,
    },
    footer,
    discreet,
    rowActionsLabel: t("common.manage"),
    onOpenValidator,
    onSelectRowAction: () => undefined,
    onSelectHeaderAction,
    onStartDelegating: () => undefined,
    onLearnMore: () => openURL(stakingUrl),
    onSelectFooterAction: () => undefined,
    testID: "account-detail-tron-votes",
  };
};
