// @flow

import React from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import colors from "../../colors";
import LText from "../../components/LText";
import Info from "../../icons/Info";

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
  if (!account.tronResources) return null;

  const {
    energy,
    bandwidth: { freeUsed, freeLimit, gainedUsed, gainedLimit } = {},
    tronPower,
  } = account.tronResources;

  const spendableBalance = formatCurrencyUnit(
    account.unit,
    account.spendableBalance,
    formatConfig,
  );

  const formatedEnergy = energy;

  const formatedBandwidth = freeLimit + gainedLimit - gainedUsed - freeUsed;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.root}
    >
      <TouchableOpacity
        onPress={() => {
          /** @TODO redirect to info modal */
        }}
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
