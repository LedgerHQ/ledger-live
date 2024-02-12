import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import type { Account } from "@ledgerhq/types-live";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import {
  activatableVotes,
  availablePendingWithdrawals,
  fallbackValidatorGroup,
  isDefaultValidatorGroupAddress,
  voteStatus,
} from "@ledgerhq/live-common/families/celo/logic";
import { CeloAccount, CeloVote } from "@ledgerhq/live-common/families/celo/types";
import { StackNavigationProp } from "@react-navigation/stack";
import Alert from "~/components/Alert";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import DelegationDrawer from "~/components/DelegationDrawer";
import type { IconProps } from "~/components/DelegationDrawer";
import Touchable from "~/components/Touchable";
import { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "~/const";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import NominateIcon from "~/icons/Vote";
import RevokeIcon from "~/icons/VoteNay";
import Info from "~/icons/Info";
import DelegationRow from "./Row";
import DelegationLabelRight from "./LabelRight";
import ValidatorImage from "../../cosmos/shared/ValidatorImage";
import { formatAmount } from "./utils";
import CheckCircle from "~/icons/CheckCircle";
import Loader from "~/icons/Loader";

type Props = {
  account: Account;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, null);
  const currency = getAccountCurrency(mainAccount);
  const navigation = useNavigation();
  const { validatorGroups } = useCeloPreloadData();
  const { celoResources } = mainAccount as CeloAccount;
  const { votes, lockedBalance } = celoResources;

  const withdrawEnabled = availablePendingWithdrawals(account as CeloAccount).length;
  const activatingEnabled = activatableVotes(account as CeloAccount).length;
  const noLockedCelo = !lockedBalance.gt(0);
  const [vote, setVote] = useState<CeloVote>();
  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown };
    }) => {
      setVote(undefined);
      // This is complicated (even impossible?) to type properly…
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onActivate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloActivateFlow,
      screen: ScreenName.CeloActivateSummary,
    });
  }, [onNavigate]);

  const onRevoke = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloRevokeFlow,
      screen: ScreenName.CeloRevokeSummary,
    });
  }, [onNavigate]);

  const onWithdraw = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloWithdrawFlow,
      screen: ScreenName.CeloWithdrawAmount,
    });
  }, [onNavigate]);

  const onVote = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloVoteFlow,
      screen: votes?.length === 0 ? ScreenName.CeloVoteStarted : ScreenName.CeloVoteSummary,
      params: {},
    });
  }, [onNavigate, votes?.length]);

  const onCloseDrawer = useCallback(() => {
    setVote(undefined);
  }, []);

  const getValidatorName = useCallback(
    (vote: CeloVote): string => {
      const validatorInfo =
        validatorGroups.find(validator => validator.address === vote.validatorGroup) ||
        fallbackValidatorGroup(vote?.validatorGroup);
      return validatorInfo.name;
    },
    [validatorGroups],
  );

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const v = vote;
    let status = null;
    if (v != null) {
      status = voteStatus(v);
    }

    return v
      ? [
          {
            label: t("celo.delegation.validatorGroup"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {getValidatorName(v) ?? ""}
              </LText>
            ),
          },
          {
            label: t("delegation.validatorAddress"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(v.validatorGroup)}
                event="DelegationOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {v.validatorGroup}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("delegation.delegatedAccount"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {account.name}{" "}
              </LText>
            ),
          },
          {
            label: t("cosmos.delegation.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {!!(status === "active") && (
                  <>
                    {" "}
                    <CheckCircle color={colors.green} size={14} style={styles.icon} />{" "}
                    <Trans i18nKey={"celo.revoke.vote.active"} />{" "}
                  </>
                )}
                {!!(status === "awaitingActivation") && (
                  <>
                    {" "}
                    <Loader color={colors.warning} size={14} style={styles.icon} />{" "}
                    <Trans i18nKey={"celo.revoke.vote.awaitingActivation"} />{" "}
                  </>
                )}
                {!!(status === "pending") && (
                  <>
                    {" "}
                    <Loader color={rgba(colors.grey, 0.8)} size={14} style={styles.icon} />{" "}
                    <Trans i18nKey={"celo.revoke.vote.pending"} />{" "}
                  </>
                )}
              </LText>
            ),
          },
          ...(vote
            ? [
                {
                  label: t("operations.types.VOTE"),
                  Component: (
                    <>
                      <LText numberOfLines={1} semiBold style={[styles.valueText]}>
                        {formatAmount(account as CeloAccount, vote.amount ?? 0)}
                      </LText>
                    </>
                  ),
                },
              ]
            : []),
        ]
      : [];
  }, [
    vote,
    t,
    getValidatorName,
    account,
    colors.green,
    colors.warning,
    colors.grey,
    onOpenExplorer,
  ]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    let activateEnabled = false;
    let revokeEnabled = false;

    if (vote) {
      const status = voteStatus(vote).toString();
      activateEnabled = status === "awaitingActivation";
      revokeEnabled = status === "active";
    }

    if (vote && !vote.activatable && !vote.revokable) {
      return [
        {
          Icon: () => null,
          disabled: true,
        },
        {
          Icon: (props: IconProps) => (
            <View style={styles.expandedInfo}>
              <Circle {...props} bg={colors.lightFog}>
                <Info color={colors.grey} size={24} />
              </Circle>
              <LText color={colors.grey} style={styles.expandedInfoText}>
                <Trans i18nKey="celo.delegation.manageMultipleVoteWarning" />
              </LText>
            </View>
          ),
          disabled: true,
        },
        {
          Icon: () => null,
          disabled: true,
        },
      ];
    }

    return vote
      ? [
          {
            label: t("celo.delegation.actions.activate"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={activateEnabled ? colors.lightFog : rgba(colors.grey, 0.2)}>
                <NominateIcon
                  color={activateEnabled ? colors.grey : rgba(colors.grey, 0.2)}
                  size={24}
                />
              </Circle>
            ),
            disabled: !activateEnabled,
            onPress: onActivate,
            event: "CeloActionActivateVote",
          },
          {
            label: t("celo.delegation.actions.revoke"),
            Icon: (props: IconProps) => (
              <Circle {...props} bg={revokeEnabled ? colors.lightFog : rgba(colors.grey, 0.2)}>
                <RevokeIcon
                  color={revokeEnabled ? colors.grey : rgba(colors.grey, 0.2)}
                  size={24}
                />
              </Circle>
            ),
            disabled: !revokeEnabled,
            onPress: onRevoke,
            event: "CeloActionRevokeVote",
          },
        ]
      : [];
  }, [vote, t, onActivate, onRevoke, colors.lightFog, colors.grey]);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            isLedger={vote && isDefaultValidatorGroupAddress(vote.validatorGroup)}
            name={vote ? getValidatorName(vote) : ""}
            size={size}
          />
        )}
        amount={vote?.amount ?? new BigNumber(0)}
        data={data}
        actions={actions}
      />
      {!votes || votes.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("celo.earnRewards.description", {
            name: account.currency.name,
          })}
          infoUrl={urls.celoStakingRewards}
          infoTitle={t("celo.emptyState.info")}
          onPress={onVote}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("account.delegation.sectionLabel")}
            RightComponent={<DelegationLabelRight disabled={noLockedCelo} onPress={onVote} />}
          />

          {!!withdrawEnabled && (
            <View style={styles.alert}>
              <Alert
                type="warning"
                title={t("celo.alerts.withdrawableAssets")}
                learnMoreKey={t("celo.withdraw.title")}
                onLearnMore={onWithdraw}
                learnMoreIsInternal={true}
              />
            </View>
          )}

          {!!activatingEnabled && (
            <View style={styles.alert}>
              <Alert
                type="warning"
                title={t("celo.alerts.activatableVotes")}
                learnMoreKey={t("celo.activate.title")}
                onLearnMore={onActivate}
                learnMoreIsInternal={true}
              />
            </View>
          )}

          {votes?.map((v, i) => (
            <>
              <View key={v.validatorGroup} style={[styles.delegationsWrapper]}>
                <DelegationRow
                  account={account as CeloAccount}
                  vote={v}
                  currency={currency}
                  onPress={() => setVote(v)}
                  isLast={i === votes?.length - 1}
                  getValidatorName={getValidatorName}
                />
              </View>
            </>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CeloDelegations({ account }: Props) {
  if (!(account as CeloAccount).celoResources) return null;
  return <Delegations account={account} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,

    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
  wrapper: {
    marginBottom: 16,
  },
  delegationsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
  alert: {
    marginTop: 4,
  },
  underline: {
    fontWeight: "500",
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  icon: {
    alignSelf: "flex-end",
    marginStart: 4,
  },
  expandedInfo: {
    width: 280,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyItems: "center",
  },
  expandedInfoText: {
    textAlign: "justify",
  },
});
