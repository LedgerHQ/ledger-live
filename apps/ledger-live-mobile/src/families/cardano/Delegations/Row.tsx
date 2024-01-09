import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import type { CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";
import { LEDGER_POOL_IDS } from "@ledgerhq/live-common/families/cardano/utils";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";
import PoolImage from "../shared/PoolImage";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import BigNumber from "bignumber.js";

type Props = {
  balance: BigNumber;
  delegation: CardanoDelegation;
  currency: Currency;
  unit: Unit;
  onPress: (delegation: CardanoDelegation) => void;
  isLast?: boolean;
};

export default function DelegationRow({
  balance,
  delegation,
  currency,
  unit,
  onPress,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={() => onPress(delegation)}
    >
      <View style={[styles.icon]}>
        <PoolImage
          size={42}
          isLedger={LEDGER_POOL_IDS.includes(delegation.poolId)}
          name={delegation?.name ?? delegation.poolId ?? ""}
        />
      </View>

      <View style={styles.nameWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
          {delegation?.name ?? delegation.poolId}
        </Text>

        <View style={styles.row}>
          <LText style={styles.seeMore} color="live">
            {t("common.seeMore")}
          </LText>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>

      <View style={styles.rightWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"}>
          <CurrencyUnitValue value={balance} unit={unit} />
        </Text>

        <LText color="grey">
          <CounterValue
            currency={currency}
            showCode
            value={balance}
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
    paddingVertical: 16,
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
