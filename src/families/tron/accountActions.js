// @flow
import React, { useCallback, useState } from "react";
import { View, TouchableHighlight, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { BigNumber } from "bignumber.js";

import { getAccountUnit } from "@ledgerhq/live-common/lib/account";

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

type ChoiceButtonProps = {
  disabled: boolean,
  onPress: () => void,
  label: React$Node,
  Icon: any,
  extra?: React$Node,
};

const ChoiceButton = ({
  disabled,
  onPress,
  label,
  Icon,
  extra,
}: ChoiceButtonProps) => (
  <TouchableHighlight
    underlayColor={colors.lightFog}
    style={styles.button}
    disabled={disabled}
    onPress={onPress}
  >
    <>
      <Icon color={disabled ? colors.grey : colors.darkBlue} size={22} />
      <LText
        style={[styles.buttonLabel, disabled ? styles.disabledButton : {}]}
        semiBold
      >
        {label}
      </LText>
      <View style={styles.extraButton}>{extra}</View>
    </>
  </TouchableHighlight>
);

const ManageAction = ({
  // account,
  style,
  account,
  onNavigate,
}: {
  account: Account,
  onNavigate: (selection: string) => void,
  style: *,
}) => {
  const [modalOpen, setModalOpen] = useState();
  const onOpenModal = useCallback(() => setModalOpen(true), []);
  const onCloseModal = useCallback(() => setModalOpen(false), []);

  /** @TODO fetch this from common */
  const unit = getAccountUnit(account);
  const minAmount = 10 ** unit.magnitude;

  const {
    spendableBalance,
    tronResources: {
      tronPower,
      frozen: { bandwidth, energy } = {},
      frozen,
    } = {},
  } = account;

  const canFreeze = spendableBalance && spendableBalance.gt(minAmount);

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
      .gt(minAmount) &&
    effectiveTimeToUnfreeze < Date.now();

  const canVote = tronPower > 0;

  const onSelectAction = useCallback(
    (selection: ?string) => {
      onCloseModal();
      if (selection) onNavigate(selection);
    },
    [onCloseModal, onNavigate],
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
            onSelectAction(canVote ? "FreezeAmount" : "FreezeInfo")
          }
          label={<Trans i18nKey="tron.manage.freeze.title" />}
          Icon={FreezeIcon}
        />
        <ChoiceButton
          disabled={!canUnfreeze}
          onPress={() => onSelectAction()}
          label={<Trans i18nKey="tron.manage.unfreeze.title" />}
          Icon={UnfreezeIcon}
          extra={
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
          onPress={() => onSelectAction()}
          label={<Trans i18nKey="tron.manage.vote.title" />}
          Icon={VoteIcon}
        />
      </BottomModal>
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  button: {
    width: "100%",
    height: "auto",
    padding: 16,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: 4,
  },
  buttonLabel: {
    color: colors.darkBlue,
    fontSize: 18,
    lineHeight: 22,
    marginHorizontal: 10,
  },
  extraButton: {
    flex: 1,
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
  ManageAction,
};
