// @flow
import React, { useCallback, useState, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { BigNumber } from "bignumber.js";

import {
  MIN_TRANSACTION_AMOUNT,
  getLastVotedDate,
} from "@ledgerhq/live-common/lib/families/tron/react";

import Button from "../../components/Button";
import BottomModal from "../../components/BottomModal";
import Ellipsis from "../../icons/Ellipsis";
import FreezeIcon from "../../icons/Freeze";
import UnfreezeIcon from "../../icons/Unfreeze";
import VoteIcon from "../../icons/Vote";
import ClockIcon from "../../icons/Clock";
import LText from "../../components/LText";
import DateFromNow from "../../components/DateFromNow";
import colors from "../../colors";
import { NavigatorName, ScreenName } from "../../const";

type ChoiceButtonProps = {
  disabled: boolean,
  onPress: () => void,
  label: React$Node,
  description: React$Node,
  Icon: any,
  extra?: React$Node,
};

const ChoiceButton = ({
  disabled,
  onPress,
  label,
  description,
  Icon,
  extra,
}: ChoiceButtonProps) => (
  <TouchableOpacity style={styles.button} disabled={disabled} onPress={onPress}>
    <View
      style={[
        styles.buttonIcon,
        disabled ? { backgroundColor: colors.lightFog } : {},
      ]}
    >
      <Icon color={disabled ? colors.grey : colors.live} size={18} />
    </View>

    <View style={styles.buttonLabelContainer}>
      <LText
        style={[styles.buttonLabel, disabled ? styles.disabledButton : {}]}
        semiBold
      >
        {label}
      </LText>
      <LText style={[styles.buttonDesc]}>{description}</LText>
    </View>
    {extra && <View style={styles.extraButton}>{extra}</View>}
  </TouchableOpacity>
);

const Manage = ({
  // account,
  style,
  account,
  onNavigate,
}: {
  account: Account,
  onNavigate: OnNavigate,
  style: any,
}) => {
  const [modalOpen, setModalOpen] = useState();
  const onOpenModal = useCallback(() => setModalOpen(true), []);
  const onCloseModal = useCallback(() => setModalOpen(false), []);

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

  const lastVotedDate = useMemo(() => getLastVotedDate(account), [account]);

  const onSelectAction = useCallback(
    (selection: ?string, options?: NavOptions) => {
      onCloseModal();
      if (selection)
        onNavigate(selection, { ...options, params: { accountId } });
    },
    [onCloseModal, onNavigate, accountId],
  );

  return (
    <>
      <Button
        event="AccountManage"
        type="primary"
        disabled={!canVote && !canFreeze && !canUnfreeze}
        IconLeft={Ellipsis}
        onPress={onOpenModal}
        title={<Trans i18nKey="account.manage" />}
        containerStyle={style}
      />
      <BottomModal
        isOpened={!!modalOpen}
        onClose={onCloseModal}
        containerStyle={styles.modal}
      >
        <ChoiceButton
          disabled={!canFreeze}
          onPress={() =>
            onSelectAction(NavigatorName.Freeze, {
              screen: canVote ? ScreenName.FreezeAmount : ScreenName.FreezeInfo,
            })
          }
          label={<Trans i18nKey="tron.manage.freeze.title" />}
          description={<Trans i18nKey="tron.manage.freeze.description" />}
          Icon={FreezeIcon}
        />
        <ChoiceButton
          disabled={!canUnfreeze}
          onPress={() =>
            onSelectAction(NavigatorName.Unfreeze, {
              screen: ScreenName.UnfreezeAmount,
            })
          }
          label={<Trans i18nKey="tron.manage.unfreeze.title" />}
          description={<Trans i18nKey="tron.manage.unfreeze.description" />}
          Icon={UnfreezeIcon}
          extra={
            !canUnfreeze &&
            effectiveTimeToUnfreeze < Infinity && (
              <View style={styles.timeWarn}>
                <ClockIcon color={colors.grey} size={16} />
                <LText style={styles.timeLabel} semiBold>
                  <DateFromNow date={effectiveTimeToUnfreeze} />
                </LText>
              </View>
            )
          }
        />
        <ChoiceButton
          disabled={!canVote}
          onPress={() =>
            onSelectAction(NavigatorName.TronVoteFlow, {
              screen: lastVotedDate ? "VoteSelectValidator" : "VoteStarted",
            })
          }
          label={<Trans i18nKey="tron.manage.vote.title" />}
          description={<Trans i18nKey="tron.manage.vote.description" />}
          Icon={VoteIcon}
        />
      </BottomModal>
    </>
  );
};

const getManageAction = ({
  // account,
  style,
  account,
  onNavigate,
}: {
  account: Account,
  onNavigate: OnNavigate,
  style: any,
}) => {
  if (!account.tronResources) return null;

  return <Manage style={style} account={account} onNavigate={onNavigate} />;
};

type OnNavigate = (name: string, optinos?: NavOptions) => void;

type NavOptions = {
  screen: string,
  params?: { [key: string]: any },
};

const styles = StyleSheet.create({
  modal: {
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  button: {
    width: "100%",
    height: "auto",
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  buttonIcon: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: colors.lightLive,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabelContainer: {
    flex: 1,
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    marginHorizontal: 10,
  },
  buttonLabel: {
    color: colors.darkBlue,
    fontSize: 18,
    lineHeight: 22,
  },
  buttonDesc: {
    color: colors.grey,
    fontSize: 13,
    lineHeight: 16,
  },
  extraButton: {
    flexShrink: 1,
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
  },
  timeWarn: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
    borderRadius: 4,
    backgroundColor: colors.lightFog,
    padding: 8,
  },
  timeLabel: {
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 16,
    color: colors.grey,
  },
  disabledButton: {
    color: colors.grey,
  },
});

export default {
  getManageAction,
};
