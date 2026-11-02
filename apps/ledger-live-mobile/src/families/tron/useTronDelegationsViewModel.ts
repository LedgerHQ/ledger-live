import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BigNumber } from "bignumber.js";
import {
  MIN_TRANSACTION_AMOUNT,
  formatVotes,
  getLastVotedDate,
  useTronSuperRepresentatives,
} from "@ledgerhq/live-common/families/tron/react";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { getAddressExplorer, getDefaultExplorerView } from "@domain/entity-currency-crypto";
import type { AccountDelegationsProps } from "@features/flow-account-detail-delegations";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { discreetModeSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";

const YIELD_ID = "tron-trx-native-staking";
const SECONDS_PER_STEP = 60;
const HOURS_PER_DAY = 24;
const TIME_UNITS = ["seconds", "minutes", "hours", "days"] as const;

type PendingAction = "CLAIM_REWARDS" | "REVOTE";

type Translate = ReturnType<typeof useTranslation>["t"];
type HeaderAction = NonNullable<AccountDelegationsProps["headerActions"]>[number];

const formatDateFromNow = (t: Translate, date: number) => {
  const now = Date.now();
  const diff = Math.abs((date - now) / 1000);
  let unitIndex = Math.floor(Math.log(diff) / Math.log(SECONDS_PER_STEP));
  let time = Number.parseFloat((diff / SECONDS_PER_STEP ** Math.min(2, unitIndex)).toFixed(0));

  if (unitIndex > 1 && time >= HOURS_PER_DAY) {
    unitIndex = 3;
    time = Number.parseFloat((time / HOURS_PER_DAY).toFixed(0));
  }

  return t(`common.${date < now ? "timeAgo" : "fromNow"}.${TIME_UNITS[unitIndex]}`, {
    count: time,
    time,
  });
};

type TitleInput = { showVotes: boolean; tronPower: number; votesCount: number };

const buildTitle = (t: Translate, { showVotes, tronPower, votesCount }: TitleInput) => {
  if (showVotes) return t("tron.voting.header", { total: votesCount });
  return t(tronPower > 0 ? "tron.voting.votes.title" : "account.delegation.info.title");
};

const buildRows = (
  votes: ReturnType<typeof formatVotes>,
  duration: string,
): AccountDelegationsProps["rows"] =>
  votes.map(({ name, address, voteCount }) => ({
    id: address,
    validator: { name: name ?? address, description: duration || undefined },
    cells: { amount: { value: String(voteCount), sensitive: true } },
    actions: [],
  }));

const buildHeaderActions = (
  t: Translate,
  { showVotes, hasRewards }: { showVotes: boolean; hasRewards: boolean },
): HeaderAction[] => {
  const actions: HeaderAction[] = [];
  if (showVotes) actions.push({ id: "vote", label: t("tron.voting.manageVotes") });
  if (hasRewards || showVotes) {
    actions.push({
      id: "claim",
      label: t("tron.voting.rewards.button"),
      disabledReason: hasRewards ? undefined : t("tron.voting.noRewards"),
    });
  }
  return actions;
};

export const useTronDelegationsViewModel = (
  account: TronAccount,
): AccountDelegationsProps | undefined => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase, string, ScreenName>>();
  const discreet = useSelector(discreetModeSelector);
  const superRepresentatives = useTronSuperRepresentatives();
  const localManifest = useLocalLiveAppManifest("stakekit");
  const remoteManifest = useRemoteLiveAppManifest("stakekit");
  const manifest = remoteManifest || localManifest;
  const explorerView = getDefaultExplorerView(account.currency);

  const { spendableBalance, tronResources } = account;
  const { votes, tronPower, unwithdrawnReward } = tronResources;
  const lastVotedDate = useMemo(() => getLastVotedDate(account), [account]);

  const formattedVotes = formatVotes(votes, superRepresentatives);
  const totalVotesUsed = votes.reduce((sum, { voteCount }) => sum + voteCount, 0);
  const hasRewards = BigNumber(unwithdrawnReward).gt(0);
  const canFreeze = spendableBalance?.gt(MIN_TRANSACTION_AMOUNT);
  const showVotes = tronPower > 0 && formattedVotes.length > 0;
  const percentVotesUsed = totalVotesUsed / tronPower;

  const managePosition = useCallback(
    (pendingaction: PendingAction) => {
      if (!manifest) return;
      navigation.navigate(ScreenName.PlatformApp, {
        platform: manifest.id,
        name: manifest.name,
        accountId: account.id,
        yieldId: YIELD_ID,
        pendingaction,
      });
    },
    [account.id, manifest, navigation],
  );

  const onSelectHeaderAction = useCallback(
    (actionId: string) => managePosition(actionId === "claim" ? "CLAIM_REWARDS" : "REVOTE"),
    [managePosition],
  );

  const onOpenValidator = useCallback(
    (address: string) => {
      const url = explorerView && getAddressExplorer(explorerView, address);
      if (url) Linking.openURL(url);
    },
    [explorerView],
  );

  if (!hasRewards && !showVotes && !canFreeze) return undefined;

  const duration = lastVotedDate ? formatDateFromNow(t, lastVotedDate.valueOf()) : "";

  return {
    title: buildTitle(t, { showVotes, tronPower, votesCount: formattedVotes.length }),
    validatorColumnLabel: t("delegation.validator"),
    columns: [{ id: "amount", label: t("tron.voting.Amount") }],
    rows: showVotes ? buildRows(formattedVotes, duration) : [],
    headerActions: buildHeaderActions(t, { showVotes, hasRewards }),
    emptyState: {
      description: t(
        tronPower > 0 ? "tron.voting.votes.description" : "tron.voting.delegationEarn",
        {
          name: account.currency.name,
        },
      ),
      learnMoreLabel: t("tron.voting.howItWorks"),
      actionLabel: t(tronPower > 0 ? "tron.voting.votes.cta" : "account.delegation.info.cta"),
      actionDisabled: true,
    },
    footer:
      showVotes && percentVotesUsed < 1
        ? {
            title: t("tron.voting.remainingVotes.title"),
            description: t("tron.voting.remainingVotes.description"),
          }
        : undefined,
    discreet,
    rowActionsLabel: t("common.seeMore"),
    openValidatorLabel: t("delegation.validator"),
    onOpenValidator,
    onSelectRowAction: () => undefined,
    onSelectHeaderAction,
    onStartDelegating: () => undefined,
    onLearnMore: () => Linking.openURL(urls.tronStaking),
    testID: "account-detail-tron-votes",
  };
};
