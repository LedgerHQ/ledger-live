import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { HederaDelegationWithMeta } from "@ledgerhq/live-common/families/hedera/types";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import ValidatorIcon from "../shared/ValidatorIcon";

type Props = {
  delegationWithMeta: HederaDelegationWithMeta;
  currency: Currency;
  unit: Unit;
  onPress: (_: HederaDelegationWithMeta) => void;
  isLast?: boolean;
};

export default function DelegationRow({
  delegationWithMeta,
  currency,
  unit,
  onPress,
  isLast = false,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={() => onPress(delegationWithMeta)}
    >
      <View style={[styles.icon]}>
        <ValidatorIcon size={32} validator={delegationWithMeta.validator} />
      </View>
      <View style={styles.nameWrapper}>
        <View style={styles.row}>
          <Text
            fontWeight="semiBold"
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{ marginRight: 5 }}
          >
            {delegationWithMeta.validator.name}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.seeMore} color="live">
            {t("common.seeMore")}
          </Text>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>
      <View style={styles.rightWrapper}>
        <Text fontWeight="semiBold">
          {formatCurrencyUnit(unit, delegationWithMeta.delegated, {
            showCode: true,
            disableRounding: true,
          })}
        </Text>
        <Text color="grey">
          <CounterValue
            currency={currency}
            showCode={true}
            value={delegationWithMeta.delegated}
            alwaysShowSign={false}
            withPlaceholder
          />
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    marginLeft: 12,
  },
});
