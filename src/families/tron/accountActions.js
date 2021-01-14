// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { BigNumber } from "bignumber.js";

import {
  MIN_TRANSACTION_AMOUNT,
  getLastVotedDate,
} from "@ledgerhq/live-common/lib/families/tron/react";

import FreezeIcon from "../../icons/Freeze";
import UnfreezeIcon from "../../icons/Unfreeze";
import VoteIcon from "../../icons/Vote";
import ClockIcon from "../../icons/Clock";
import LText from "../../components/LText";
import DateFromNow from "../../components/DateFromNow";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account, colors }: { account: Account }) => {
  if (!account.tronResources) return null;

  const {
    spendableBalance,
    tronResources: {
      tronPower,
      frozen: { bandwidth, energy } = {},
      frozen,
    } = {},
  } = account;

  const accountId = account.id;

  const canFreeze =
    spendableBalance && spendableBalance.gt(MIN_TRANSACTION_AMOUNT);

  const timeToUnfreezeBandwidth =
    bandwidth && bandwidth.expiredAt ? +bandwidth.expiredAt : Infinity;

  const timeToUnfreezeEnergy =
    energy && energy.expiredAt ? +energy.expiredAt : Infinity;

  const effectiveTimeToUnfreeze = Math.min(
    timeToUnfreezeBandwidth,
    timeToUnfreezeEnergy,
  );

  const canUnfreeze =
    frozen &&
    BigNumber((bandwidth && bandwidth.amount) || 0)
      .plus((energy && energy.amount) || 0)
      .gt(MIN_TRANSACTION_AMOUNT) &&
    effectiveTimeToUnfreeze < Date.now();

  const canVote = tronPower > 0;

  const lastVotedDate = getLastVotedDate(account);

  return [
    {
      disabled: !canFreeze,
      navigationParams: [
        NavigatorName.Freeze,
        {
          screen: canVote ? ScreenName.FreezeAmount : ScreenName.FreezeInfo,
          params: { accountId },
        },
      ],
      label: <Trans i18nKey="tron.manage.freeze.title" />,
      description: <Trans i18nKey="tron.manage.freeze.description" />,
      Icon: FreezeIcon,
    },
    {
      disabled: !canUnfreeze,
      navigationParams: [
        NavigatorName.Unfreeze,
        {
          screen: ScreenName.UnfreezeAmount,
          params: { accountId },
        },
      ],
      label: <Trans i18nKey="tron.manage.unfreeze.title" />,
      description: <Trans i18nKey="tron.manage.unfreeze.description" />,
      Icon: UnfreezeIcon,
      extra: !canUnfreeze && effectiveTimeToUnfreeze < Infinity && (
        <View style={[styles.timeWarn, { backgroundColor: colors.lightFog }]}>
          <ClockIcon color={colors.grey} size={16} />
          <LText style={styles.timeLabel} semiBold color="grey">
            <DateFromNow date={effectiveTimeToUnfreeze} />
          </LText>
        </View>
      ),
    },
    {
      disabled: !canVote,
      navigationParams: [
        NavigatorName.TronVoteFlow,
        {
          screen: lastVotedDate ? "VoteSelectValidator" : "VoteStarted",
          params: { accountId },
        },
      ],
      label: <Trans i18nKey="tron.manage.vote.title" />,
      description: <Trans i18nKey="tron.manage.vote.description" />,
      Icon: VoteIcon,
    },
  ];
};

const styles = StyleSheet.create({
  timeWarn: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
    borderRadius: 4,
    padding: 8,
  },
  timeLabel: {
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default {
  getActions,
};
