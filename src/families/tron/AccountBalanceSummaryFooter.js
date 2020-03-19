// @flow

import React, { useCallback, useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import {
  formatCurrencyUnit,
  findCryptoCurrencyById,
} from "@ledgerhq/live-common/lib/currencies";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";
import colors from "../../colors";
import LText from "../../components/LText";
import Info from "../../icons/Info";
import InfoModal from "../../modals/Info";
import type { ModalInfo } from "../../modals/Info";

type Props = {
  account: any,
  countervalue: any,
};

const formatConfig = {
  disableRounding: true,
  alwaysShowSign: false,
  showCode: true,
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    energy: formatedEnergy,
    bandwidth: { freeUsed, freeLimit, gainedUsed, gainedLimit } = {},
    tronPower,
  } = account.tronResources;

  const spendableBalance = useMemo(
    () =>
      formatCurrencyUnit(account.unit, account.spendableBalance, formatConfig),
    [account.unit, account.spendableBalance],
  );

  const formatedBandwidth = useMemo(
    () => freeLimit + gainedLimit - gainedUsed - freeUsed,
    [freeLimit, gainedLimit, gainedUsed, freeUsed],
  );

  const infos = useMemo<ModalInfo[]>(() => {
    const currency = findCryptoCurrencyById("tron");
    if (!currency) {
      return [];
    }

    const TronIcon = getCryptoCurrencyIcon(currency);
    if (!TronIcon) {
      return [];
    }

    return [
      {
        Icon: () => <TronIcon color={currency.color} size={18} />,
        title: "TRX available",
        description:
          "Bandwidth Points (BP) are used for transactions you do not want to pay for. As such freezing TRX for BP will increase your daily free transactions quantity.",
      },
    ];
  }, []);

  const onPressBalance = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  if (!account.tronResources) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
    >
      <InfoModal isOpened={isModalOpen} onClose={onCloseModal} infos={infos} />
      <TouchableOpacity
        onPress={onPressBalance}
        style={styles.balanceContainer}
      >
        <View style={styles.balanceLabelContainer}>
          <LText style={styles.balanceLabel}>
            <Trans i18nKey="account.availableBalance" />
          </LText>
          <Info size={12} color={colors.grey} />
        </View>
        <LText semiBold style={styles.balance}>
          {spendableBalance}
        </LText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          /** @TODO redirect to info modal */
        }}
        style={styles.balanceContainer}
      >
        <View style={styles.balanceLabelContainer}>
          <LText style={styles.balanceLabel}>
            <Trans i18nKey="account.tronPower" />
          </LText>
          <Info size={12} color={colors.grey} />
        </View>

        <LText semiBold style={styles.balance}>
          {tronPower}
        </LText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          /** @TODO redirect to info modal */
        }}
        style={styles.balanceContainer}
      >
        <View style={styles.balanceLabelContainer}>
          <LText style={styles.balanceLabel}>
            <Trans i18nKey="account.bandwidth" />
          </LText>
          <Info size={12} color={colors.grey} />
        </View>

        <LText semiBold style={styles.balance}>
          {formatedBandwidth || "–"}
        </LText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          /** @TODO redirect to info modal */
        }}
        style={styles.balanceContainer}
      >
        <View style={styles.balanceLabelContainer}>
          <LText style={styles.balanceLabel}>
            <Trans i18nKey="account.energy" />
          </LText>
          <Info size={12} color={colors.grey} />
        </View>
        <LText semiBold style={styles.balance}>
          {formatedEnergy || "–"}
        </LText>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.lightFog,
    paddingTop: 16,
    overflow: "visible",
  },
  balanceContainer: {
    flexBasis: "auto",
    flexDirection: "column",
    marginRight: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    backgroundColor: colors.lightGrey,
  },
  balanceLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.grey,
    marginRight: 6,
  },
  balance: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.darkBlue,
  },
});

export default AccountBalanceSummaryFooter;
