// @flow
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type {
  CosmosMappedDelegation,
  CosmosMappedUnbonding,
} from "@ledgerhq/live-common/lib/families/cosmos/types";
import type { Currency } from "@ledgerhq/live-common/lib/types";
import CounterValue from "../../../components/CounterValue";
import colors from "../../../colors";
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
  const { t } = useTranslation();
  const { validator, validatorAddress, formattedAmount, amount } = delegation;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast ? styles.borderBottom : undefined,
      ]}
      onPress={() => onPress(delegation)}
    >
      <View style={styles.icon}>
        <FirstLetterIcon label={validator?.name ?? validatorAddress ?? ""} />
      </View>

      <View style={styles.nameWrapper}>
        <LText semiBold numberOfLines={1}>
          {validator?.name ?? validatorAddress}
        </LText>

        <View style={styles.row}>
          <LText style={styles.seeMore}>{t("common.seeMore")}</LText>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>

      <View style={styles.rightWrapper}>
        <LText semiBold>{formattedAmount}</LText>

        <LText style={styles.counterValue}>
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
    borderBottomColor: colors.lightGrey,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowWrapper: {
    backgroundColor: colors.white,
    padding: 16,
  },
  seeMore: {
    fontSize: 14,
    color: colors.live,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: colors.lightLive,
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  counterValue: { color: colors.grey },
  rightWrapper: {
    alignItems: "flex-end",
  },
});
