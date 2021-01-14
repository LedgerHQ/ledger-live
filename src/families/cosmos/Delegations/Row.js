// @flow
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  CosmosMappedDelegation,
  CosmosMappedUnbonding,
} from "@ledgerhq/live-common/lib/families/cosmos/types";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import CounterValue from "../../../components/CounterValue";
import ArrowRight from "../../../icons/ArrowRight";
import LText from "../../../components/LText";
import FirstLetterIcon from "../../../components/FirstLetterIcon";

type Props = {
  delegation: CosmosMappedDelegation | CosmosMappedUnbonding,
  currency: Currency,
  onPress: (delegation: CosmosMappedDelegation | CosmosMappedUnbonding) => void,
  isLast?: boolean,
};

export default function DelegationRow({
  delegation,
  currency,
  onPress,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { validator, validatorAddress, formattedAmount, amount } = delegation;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast
          ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey }
          : undefined,
      ]}
      onPress={() => onPress(delegation)}
    >
      <View style={[styles.icon, { backgroundColor: colors.lightLive }]}>
        <FirstLetterIcon label={validator?.name ?? validatorAddress ?? ""} />
      </View>

      <View style={styles.nameWrapper}>
        <LText semiBold numberOfLines={1}>
          {validator?.name ?? validatorAddress}
        </LText>

        <View style={styles.row}>
          <LText style={styles.seeMore} color="live">
            {t("common.seeMore")}
          </LText>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>

      <View style={styles.rightWrapper}>
        <LText semiBold>{formattedAmount}</LText>

        <LText color="grey">
          <CounterValue
            currency={currency}
            showCode
            value={amount}
            alwaysShowSign={false}
            withPlaceholder
          />
        </LText>
      </View>
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
  seeMore: {
    fontSize: 14,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 5,

    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  rightWrapper: {
    alignItems: "flex-end",
  },
});
