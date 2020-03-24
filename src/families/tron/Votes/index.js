// @flow
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Linking, TouchableOpacity, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import {
  getTronSuperRepresentatives,
  getNextVotingDate,
} from "@ledgerhq/live-common/lib/api/Tron";

import { BigNumber } from "bignumber.js";
import { urls } from "../../../config/urls";

import Row from "./Row";
import Header from "./Header";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import colors from "../../../colors";
import ExternalLink from "../../../icons/ExternalLink";
import Info from "../../../icons/Info";
import DateFromNow from "../../../components/DateFromNow";

type Props = {
  account: Account,
  parentAccount: ?Account,
};

// @TODO move this to common
const useTronSuperRepresentatives = () => {
  const [sp, setSp] = useState([]);

  useEffect(() => {
    getTronSuperRepresentatives().then(setSp);
  }, []);

  return sp;
};

// @TODO move this to common
const useNewVotingDate = () => {
  const [nextVotingDate, setNextVotingDate] = useState(0);
  useEffect(() => {
    getNextVotingDate().then(d => d && setNextVotingDate(d.valueOf()));
  }, []);

  return nextVotingDate;
};

const Delegation = ({ account }: Props) => {
  const superRepresentatives = useTronSuperRepresentatives();
  const nextVotingDate = useNewVotingDate();
  const nextDate = <DateFromNow date={nextVotingDate} />;

  const {
    tronResources: { votes, tronPower, unwithdrawnReward } = {},
  } = account;

  const formattedUnwidthDrawnReward = formatCurrencyUnit(
    account.unit,
    BigNumber(unwithdrawnReward || 0),
    {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    },
  );

  const formattedVotes = useMemo(
    () =>
      votes.map(({ address, ...rest }) => ({
        validator: superRepresentatives.find(sp => sp.address === address),
        address,
        ...rest,
      })),
    [votes, superRepresentatives],
  );

  const totalVotesUsed = votes.reduce(
    (sum, { voteCount }) => sum + voteCount,
    0,
  );

  const onDelegate = useCallback(() => {
    /** @TODO open delegation modal */
  }, []);

  const hasRewards = BigNumber(unwithdrawnReward).gt(0);

  return (
    <View style={styles.root}>
      {tronPower > 0 && formattedVotes.length > 0 ? (
        <>
          {hasRewards && (
            <View style={styles.rewardSection}>
              <View style={styles.labelSection}>
                <View style={styles.labelContainer}>
                  <LText style={styles.label}>
                    <Trans i18nKey="tron.voting.rewards.title" />
                  </LText>
                  <Info size={12} color={colors.grey} />
                </View>
                <LText semiBold style={styles.title}>
                  {formattedUnwidthDrawnReward}
                </LText>
              </View>
              <Button
                containerStyle={styles.collectButton}
                type="primary"
                event=""
                onPress={() => {
                  /** @TODO open claim rewards transaction modal */
                }}
                title={<Trans i18nKey="tron.voting.rewards.button" />}
              />
            </View>
          )}
          <View style={[styles.container, styles.noPadding]}>
            <Header
              total={tronPower}
              used={totalVotesUsed}
              onPress={onDelegate}
            />
            {formattedVotes.map(({ validator, address, voteCount }, index) => (
              <Row
                key={index}
                validator={validator}
                address={address}
                amount={voteCount}
                duration={nextDate}
                percentTP={((voteCount * 1e2) / tronPower).toFixed(2)}
              />
            ))}
          </View>
        </>
      ) : (
        <View style={styles.container}>
          <View style={styles.container}>
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
              <ExternalLink size={11} color={colors.grey} />
            </TouchableOpacity>
          </View>
          <Button
            type="primary"
            onPress={onDelegate}
            title={<Trans i18nKey="tron.voting.startEarning" />}
            event=""
          />
        </View>
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
  noPadding: {
    padding: 0,
  },
  rewardSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  collectButton: {
    flexBasis: "auto",
    flexGrow: 1,
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
    paddingTop: 8,
  },
  label: {
    fontSize: 13,
    color: colors.grey,
    marginRight: 6,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 8,
    color: colors.darkBlue,
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
    color: colors.grey,
    marginRight: 6,
  },
});

const Votes = ({ account, parentAccount }: Props) => {
  if (!account || !account.tronResources) return null;

  return <Delegation account={account} parentAccount={parentAccount} />;
};

export default Votes;
