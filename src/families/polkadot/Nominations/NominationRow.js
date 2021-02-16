// @flow
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Polkadot as PolkadotIdenticon } from "@polkadot/reactnative-identicon/icons";

import type {
  PolkadotNomination,
  PolkadotValidator,
} from "@ledgerhq/live-common/lib/families/polkadot/types";
import type { Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";

import { useTheme } from "@react-navigation/native";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import LText from "../../../components/LText";
import ArrowRight from "../../../icons/ArrowRight";

type Props = {
  nomination: PolkadotNomination,
  validator: ?PolkadotValidator,
  account: Account,
  onPress: (nomination: PolkadotNomination) => void,
  isLast?: boolean,
};

export default function NominationRow({
  nomination,
  validator,
  account,
  onPress,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { value, address, status } = nomination;
  const name = validator?.identity || address;
  // const total = validator?.totalBonded ?? null;
  // const commission = validator?.commission ?? null;

  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast
          ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey }
          : undefined,
      ]}
      onPress={() => onPress(nomination)}
    >
      <View style={styles.icon}>
        <PolkadotIdenticon address={address} size={32} />
      </View>

      <View style={styles.nameWrapper}>
        <LText semiBold numberOfLines={1}>
          {name}
        </LText>

        <View style={styles.statusWrapper}>
          {status === "active" && (
            <LText color="success" numberOfLines={1}>
              {t("polkadot.nomination.active")}
            </LText>
          )}
          {status === "inactive" && (
            <LText color="grey" numberOfLines={1}>
              {t("polkadot.nomination.inactive")}
            </LText>
          )}
          {status === "waiting" && (
            <LText color="grey" numberOfLines={1}>
              {t("polkadot.nomination.waiting")}
            </LText>
          )}
          {!status && (
            <LText color="orange" numberOfLines={1}>
              {t("polkadot.nomination.notValidator")}
            </LText>
          )}
          <View style={[styles.seeMore, { borderLeftColor: colors.grey }]}>
            <LText style={styles.seeMoreText} color="live">
              {t("common.seeMore")}
            </LText>
            <ArrowRight color={colors.live} size={14} />
          </View>
        </View>
      </View>

      {status === "active" || status === "inactive" ? (
        <View style={styles.rightWrapper}>
          <LText semiBold>
            {" "}
            <CurrencyUnitValue value={value} unit={unit} />
          </LText>

          <LText color="grey">
            <CounterValue
              currency={currency}
              showCode
              value={value}
              alwaysShowSign={false}
              withPlaceholder
            />
          </LText>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  statusWrapper: {
    flex: 1,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  rightWrapper: {
    alignItems: "flex-end",
  },
  seeMore: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
  },
  seeMoreText: {
    fontSize: 14,
    textAlignVertical: "top",
  },
});
