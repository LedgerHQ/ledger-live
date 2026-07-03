import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import { ValidatorImage } from "../StakingFlow/ValidatorRow";

type Props = {
  account: MinaAccount;
  currency: Currency;
  unit: Unit;
  onPress: (account: MinaAccount) => void;
};

export default function DelegationRow({ account, currency, unit, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { delegateInfo } = account.resources ?? {};
  const validatorName = delegateInfo?.identityName || delegateInfo?.address || "-";

  return (
    <TouchableOpacity
      style={[styles.row, styles.wrapper, { backgroundColor: colors.card }]}
      onPress={() => onPress(account)}
    >
      <View style={styles.icon}>
        <ValidatorImage name={validatorName} size={32} />
      </View>

      <View style={styles.nameWrapper}>
        <Text fontWeight="semiBold" numberOfLines={1} ellipsizeMode="middle">
          {validatorName}
        </Text>
        <View style={styles.row}>
          <Text style={styles.seeMore} color="live">
            {t("common.seeMore")}
          </Text>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>

      <View style={styles.rightWrapper}>
        <Text fontWeight="semiBold">
          {formatCurrencyUnit(unit, account.balance, {
            showCode: true,
            disableRounding: true,
          })}
        </Text>
        <Text color="grey">
          <CounterValue
            currency={currency}
            showCode={true}
            value={account.balance}
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
    padding: 16,
    borderRadius: 4,
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
