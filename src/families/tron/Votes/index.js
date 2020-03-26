// @flow
import React, { useCallback } from "react";
import { View, Linking, TouchableOpacity, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";

import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account/helpers";
import {
  useTronSuperRepresentatives,
  useNextVotingDate,
  formatVotes,
  getNextRewardDate,
} from "@ledgerhq/live-common/lib/families/tron/react";
import { getDefaultExplorerView } from "@ledgerhq/live-common/lib/explorers";

import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { urls } from "../../../config/urls";
import Row from "./Row";
import Header from "./Header";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import colors from "../../../colors";
import ExternalLink from "../../../icons/ExternalLink";
import Info from "../../../icons/Info";
import DateFromNow from "../../../components/DateFromNow";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import IlluRewards from "../IlluRewards";

type Props = {
  account: Account,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      parentId: string,
    },
  }>,
};

const Delegation = ({ account, parentAccount, navigation }: Props) => {
  const superRepresentatives = useTronSuperRepresentatives();
  const nextVotingDate = useNextVotingDate();
  const nextDate = nextVotingDate ? (
    <DateFromNow date={nextVotingDate} />
  ) : null;
  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const explorerView = getDefaultExplorerView(account.currency);
  const accountId = account.id;
  const parentId = parentAccount && parentAccount.id;

  /** @TODO fetch this from common */
  const minAmount = 10 ** unit.magnitude;

  const { spendableBalance, tronResources } = account;

  const canFreeze = spendableBalance && spendableBalance.gt(minAmount);

  const { votes, tronPower, unwithdrawnReward } = tronResources || {};

  const formattedUnwidthDrawnReward = BigNumber(unwithdrawnReward || 0);

  const formattedVotes = formatVotes(votes, superRepresentatives);

  const totalVotesUsed = votes.reduce(
    (sum, { voteCount }) => sum + voteCount,
    0,
  );

  const claimRewards = useCallback(
    () =>
      navigation.navigate("ClaimRewardsConnectDevice", {
        accountId,
        parentId,
      }),
    [accountId, navigation, parentId],
  );

  const onDelegateFreeze = useCallback(
    () =>
      navigation.navigate("FreezeInfo", {
        accountId,
        parentId,
      }),
    [accountId, navigation, parentId],
  );

  const onDelegate = useCallback(() => {
    /** @TODO open delegation modal */
  }, []);

  const hasRewards = BigNumber(unwithdrawnReward).gt(0);
  const nextRewardDate = getNextRewardDate(account);

  const canClaimRewards = hasRewards && !nextRewardDate;

  return (
    <View style={styles.root}>
      {hasRewards || (tronPower > 0 && formattedVotes.length > 0) ? (
        <>
          <View style={styles.labelContainer}>
            <LText semiBold style={styles.label}>
              <Trans i18nKey="tron.voting.rewards.title" />
            </LText>
            <Info size={16} color={colors.darkBlue} />
          </View>
          <View style={styles.rewardSection}>
            <View style={styles.labelSection}>
              <LText semiBold style={styles.title}>
                <CurrencyUnitValue
                  unit={unit}
                  value={formattedUnwidthDrawnReward}
                />
              </LText>
              <LText semiBold style={styles.subtitle}>
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
      ) : null}
      {tronPower > 0 ? (
        formattedVotes.length > 0 ? (
          <>
            <Header
              total={tronPower}
              used={totalVotesUsed}
              count={formattedVotes.length}
              onPress={onDelegate}
            />
            <View style={[styles.container, styles.noPadding]}>
              {formattedVotes.map(
                ({ validator, address, voteCount }, index) => (
                  <Row
                    key={index}
                    validator={validator}
                    address={address}
                    amount={voteCount}
                    duration={nextDate}
                    explorerView={explorerView}
                  />
                ),
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.labelContainer}>
              <LText semiBold style={styles.label}>
                <Trans i18nKey="tron.voting.votes.title" />
              </LText>
            </View>
            <View style={styles.container}>
              <View style={styles.container}>
                <LText style={styles.description}>
                  <Trans
                    i18nKey="tron.voting.votes.description"
                    values={{ name: account.currency.name }}
                  />
                </LText>
                <TouchableOpacity
                  style={styles.infoLinkContainer}
                  onPress={() => Linking.openURL(urls.delegation)}
                >
                  <LText bold style={styles.infoLink}>
                    <Trans i18nKey="tron.voting.howItWorks" />
                  </LText>
                  <ExternalLink size={11} color={colors.live} />
                </TouchableOpacity>
              </View>
              <Button
                type="primary"
                onPress={onDelegate}
                title={<Trans i18nKey="tron.voting.votes.cta" />}
                event=""
              />
            </View>
          </>
        )
      ) : (
        canFreeze && (
          <View style={styles.container}>
            <View style={styles.container}>
              <IlluRewards style={styles.illustration} />
              <LText semiBold style={styles.title}>
                <Trans i18nKey="tron.voting.earnRewars" />
              </LText>
              <LText style={styles.description}>
                <Trans
                  i18nKey="tron.voting.delegationEarn"
                  values={{ name: account.currency.name }}
                />
              </LText>
              <TouchableOpacity
                style={styles.infoLinkContainer}
                onPress={() => Linking.openURL(urls.delegation)}
              >
                <LText bold style={styles.infoLink}>
                  <Trans i18nKey="tron.voting.howItWorks" />
                </LText>
                <ExternalLink size={11} color={colors.live} />
              </TouchableOpacity>
            </View>
            <Button
              type="primary"
              disabled={!canFreeze}
              onPress={onDelegateFreeze}
              title={<Trans i18nKey="tron.voting.startEarning" />}
              event=""
            />
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  container: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 4,
    flexDirection: "column",
    alignItems: "stretch",
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  noPadding: {
    padding: 0,
  },
  rewardSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
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
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 18,
    color: colors.darkBlue,
    marginRight: 6,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 4,
    color: colors.darkBlue,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: "left",
    color: colors.grey,
  },
  description: {
    fontSize: 14,
    lineHeight: 17,
    paddingVertical: 8,
    textAlign: "center",
    color: colors.grey,
  },
  infoLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLink: {
    fontSize: 13,
    lineHeight: 22,
    paddingVertical: 8,
    textAlign: "center",
    color: colors.live,
    marginRight: 6,
  },
});

const Votes = ({ account, parentAccount, navigation }: Props) => {
  if (!account || !account.tronResources) return null;

  return (
    <Delegation
      account={account}
      parentAccount={parentAccount}
      navigation={navigation}
    />
  );
};

export default withNavigation(Votes);
