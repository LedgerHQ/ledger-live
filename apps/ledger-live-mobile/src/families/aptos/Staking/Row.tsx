import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { AptosMappedStakingPosition } from "@ledgerhq/live-common/families/aptos/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import ValidatorImage from "../shared/ValidatorImage";

type Props = {
  stakingPosition: AptosMappedStakingPosition;
  currency: Currency;
  onPress: (_: AptosMappedStakingPosition) => void;
  isLast?: boolean;
};

export default function StakingRow({
  stakingPosition,
  currency,
  onPress,
  isLast = false,
}: Readonly<Props>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { validatorId, formattedAmount, active } = stakingPosition;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={() => onPress(stakingPosition)}
    >
      <View style={[styles.icon]}>
        <ValidatorImage size={42} isLedger={false} name={validatorId ?? ""} />
      </View>

      <View style={styles.nameWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
          {validatorId}
        </Text>

        <View style={styles.row}>
          <Text variant={"body"} color="live">
            {t("common.seeMore")}
          </Text>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>

      <View style={styles.rightWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"}>
          {formattedAmount}
        </Text>

        <Text color="grey">
          <CounterValue
            currency={currency}
            showCode
            value={active}
            alwaysShowSign={false}
            withPlaceholder
          />
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 16,
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
