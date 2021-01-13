// @flow
import React, { useCallback, useState, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account/helpers";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  useTronSuperRepresentatives,
  formatVotes,
  getNextRewardDate,
  getLastVotedDate,
  MIN_TRANSACTION_AMOUNT,
} from "@ledgerhq/live-common/lib/families/tron/react";
import { getDefaultExplorerView } from "@ledgerhq/live-common/lib/explorers";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { urls } from "../../../config/urls";
import Row from "./Row";
import Header from "./Header";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import { NavigatorName, ScreenName } from "../../../const";
import Info from "../../../icons/Info";
import ArrowRight from "../../../icons/ArrowRight";
import DateFromNow from "../../../components/DateFromNow";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import IlluRewards from "../../../icons/images/Rewards";
import ProgressCircle from "../../../components/ProgressCircle";
import InfoModal from "../../../modals/Info";
import ClaimRewards from "../../../icons/ClaimReward";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import AccountSectionLabel from "../../../components/AccountSectionLabel";

type Props = {
  account: Account,
  parentAccount: ?Account,
};

const Delegation = ({ account, parentAccount }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [infoRewardsModal, setRewardsInfoModal] = useState();

  const superRepresentatives = useTronSuperRepresentatives();
  const lastVotedDate = useMemo(() => getLastVotedDate(account), [account]);

  const infoRewardsModalData = useMemo(
    () => [
      {
        Icon: () => <ClaimRewards size={18} color={colors.darkBlue} />,
        title: <Trans i18nKey="tron.info.claimRewards.title" />,
        description: <Trans i18nKey="tron.info.claimRewards.description" />,
      },
    ],
    [colors.darkBlue],
  );

  const lastDate = lastVotedDate ? (
    <DateFromNow date={lastVotedDate.valueOf()} />
  ) : null;

  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const explorerView = getDefaultExplorerView(account.currency);
  const accountId = account.id;
  const parentId = parentAccount && parentAccount.id;

  const { spendableBalance, tronResources } = account;

  const canFreeze =
    spendableBalance && spendableBalance.gt(MIN_TRANSACTION_AMOUNT);

  const { votes, tronPower, unwithdrawnReward } = tronResources || {};

  const formattedUnwidthDrawnReward = BigNumber(unwithdrawnReward || 0);

  const formattedVotes = formatVotes(votes, superRepresentatives);

  const totalVotesUsed = votes.reduce(
    (sum, { voteCount }) => sum + voteCount,
    0,
  );

  const openRewardsInfoModal = useCallback(() => setRewardsInfoModal(true), [
    setRewardsInfoModal,
  ]);

  const closeRewardsInfoModal = useCallback(() => setRewardsInfoModal(false), [
    setRewardsInfoModal,
  ]);

  const bridge = getAccountBridge(account, undefined);

  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      mode: "claimReward",
    });

    return { account, transaction };
  });

  const claimRewards = useCallback(() => {
    navigation.navigate(NavigatorName.ClaimRewards, {
      screen: ScreenName.ClaimRewardsSelectDevice,
      params: {
        accountId,
        parentId,
        transaction,
        status,
      },
    });
  }, [accountId, navigation, parentId, transaction, status]);

  const onDelegateFreeze = useCallback(() => {
    navigation.navigate(NavigatorName.Freeze, {
      screen: ScreenName.FreezeInfo,
      params: {
        accountId,
        parentId,
      },
    });
  }, [accountId, navigation, parentId]);

  const onManageVotes = useCallback(() => {
    navigation.navigate(NavigatorName.TronVoteFlow, {
      screen: ScreenName.VoteCast,
      params: {
        accountId,
        parentId,
      },
    });
  }, [navigation, accountId, parentId]);

  const onDelegate = useCallback(() => {
    const screenName = lastVotedDate
      ? ScreenName.VoteSelectValidator
      : ScreenName.VoteStarted;
    navigation.navigate(NavigatorName.TronVoteFlow, {
      screen: screenName,
      params: {
        accountId,
        parentId,
      },
    });
  }, [lastVotedDate, navigation, accountId, parentId]);

  const hasRewards = BigNumber(unwithdrawnReward).gt(0);
  const nextRewardDate = getNextRewardDate(account);

  const canClaimRewards = hasRewards && !nextRewardDate;

  const percentVotesUsed = totalVotesUsed / tronPower;

  return (
    <View style={styles.root}>
      {(hasRewards || (tronPower > 0 && formattedVotes.length > 0)) && (
        <>
          <AccountSectionLabel
            name={t("tron.voting.rewards.title")}
            icon={<Info size={16} color={colors.darkBlue} />}
            onPress={openRewardsInfoModal}
          />
          <View
            style={[styles.rewardSection, { backgroundColor: colors.white }]}
          >
            <View style={styles.labelSection}>
              <LText semiBold style={styles.title}>
                <CurrencyUnitValue
                  unit={unit}
                  value={formattedUnwidthDrawnReward}
                />
              </LText>
              <LText semiBold style={styles.subtitle} color="grey">
                {currency && (
                  <CounterValue
                    currency={currency}
                    value={formattedUnwidthDrawnReward}
                  />
                )}
              </LText>
            </View>
            <Button
              containerStyle={styles.collectButton}
              type="primary"
              event=""
              disabled={!canClaimRewards}
              onPress={claimRewards}
              title={<Trans i18nKey="tron.voting.rewards.button" />}
            />
          </View>
        </>
      )}
      {tronPower > 0 ? (
        formattedVotes.length > 0 ? (
          <>
            <Header count={formattedVotes.length} onPress={onManageVotes} />
            <View
              style={[
                styles.container,
                styles.noPadding,
                { backgroundColor: colors.white },
              ]}
            >
              {formattedVotes.map(
                ({ validator, address, voteCount, isSR }, index) => (
                  <Row
                    key={index}
                    validator={validator}
                    address={address}
                    amount={voteCount}
                    duration={lastDate}
                    explorerView={explorerView}
                    isSR={isSR}
                  />
                ),
              )}
              {percentVotesUsed < 1 && (
                <View style={[styles.container]}>
                  <TouchableOpacity
                    onPress={onDelegate}
                    style={[styles.warn, { backgroundColor: colors.lightLive }]}
                  >
                    <ProgressCircle
                      size={60}
                      progress={percentVotesUsed}
                      backgroundColor={colors.fog}
                    />
                    <View style={styles.warnSection}>
                      <LText
                        semiBold
                        style={[styles.warnText, styles.warnTitle]}
                      >
                        <Trans i18nKey="tron.voting.remainingVotes.title" />
                      </LText>
                      <LText style={styles.warnText} color="live">
                        <Trans i18nKey="tron.voting.remainingVotes.description" />
                      </LText>
                    </View>

                    <ArrowRight size={16} color={colors.live} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <AccountSectionLabel name={t("tron.voting.votes.title")} />
            <AccountDelegationInfo
              description={t("tron.voting.votes.description", {
                name: account.currency.name,
              })}
              infoUrl={urls.tronStaking}
              infoTitle={t("tron.voting.howItWorks")}
              onPress={onDelegate}
              ctaTitle={t("tron.voting.votes.cta")}
            />
          </>
        )
      ) : (
        canFreeze && (
          <AccountDelegationInfo
            title={t("account.delegation.info.title")}
            image={<IlluRewards style={styles.illustration} />}
            description={t("tron.voting.delegationEarn", {
              name: account.currency.name,
            })}
            infoUrl={urls.tronStaking}
            infoTitle={t("tron.voting.howItWorks")}
            disabled={!canFreeze}
            onPress={onDelegateFreeze}
            ctaTitle={t("account.delegation.info.cta")}
          />
        )
      )}
      <InfoModal
        isOpened={!!infoRewardsModal}
        onClose={closeRewardsInfoModal}
        data={infoRewardsModalData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  container: {
    padding: 16,
    borderRadius: 4,
    flexDirection: "column",
    alignItems: "stretch",
  },
  noPadding: {
    padding: 0,
  },
  rewardSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  collectButton: {
    flexBasis: "auto",
    flexGrow: 0.5,
  },
  labelSection: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  warn: {
    flexDirection: "row",
    padding: 8,

    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  warnSection: {
    flexDirection: "column",
    flex: 1,
    marginHorizontal: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  warnTitle: {
    fontSize: 14,
  },
  warnText: {
    marginLeft: 0,
    fontSize: 13,
  },
  cta: {
    flex: 1,
    flexGrow: 0.5,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: "left",
  },
});

export default function Votes({ account, parentAccount }: Props) {
  if (!account || !account.tronResources) return null;

  return <Delegation account={account} parentAccount={parentAccount} />;
}
