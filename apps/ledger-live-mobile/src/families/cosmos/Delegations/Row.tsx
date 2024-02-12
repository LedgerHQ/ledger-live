import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import {
  CosmosMappedDelegation,
  CosmosMappedUnbonding,
} from "@ledgerhq/live-common/families/cosmos/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";
import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";
import ValidatorImage from "../shared/ValidatorImage";

type Props = {
  delegation: CosmosMappedDelegation | CosmosMappedUnbonding;
  currency: CryptoOrTokenCurrency;
  onPress: (_: CosmosMappedDelegation | CosmosMappedUnbonding) => void;
  isLast?: boolean;
};

export default function DelegationRow({ delegation, currency, onPress, isLast = false }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { validator, validatorAddress, formattedAmount, amount } = delegation;

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
        <ValidatorImage
          size={42}
          isLedger={validatorAddress === cryptoFactory(currency.id).ledgerValidator}
          name={validator?.name ?? validatorAddress ?? ""}
        />
      </View>

      <View style={styles.nameWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
          {validator?.name ?? validatorAddress}
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
          {formattedAmount}
        </Text>

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
