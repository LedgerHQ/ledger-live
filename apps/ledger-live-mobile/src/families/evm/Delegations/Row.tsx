import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  StakingMappedDelegation,
  StakingMappedUnbonding,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import CheckCircle from "~/icons/CheckCircle";
import Clock from "~/icons/Clock";
import LText from "~/components/LText";
import ValidatorImage from "../shared/ValidatorImage";

type Props = {
  delegation: StakingMappedDelegation | StakingMappedUnbonding;
  currency: CryptoOrTokenCurrency;
  onPress: (_: StakingMappedDelegation | StakingMappedUnbonding) => void;
  isLast?: boolean;
};

export default function DelegationRow({ delegation, currency, onPress, isLast = false }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { validator, validatorAddress, formattedAmount, amount } = delegation;
  const status = "status" in delegation ? delegation.status : undefined;

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
          isLedger={false}
          name={validator?.name ?? validatorAddress ?? ""}
        />
      </View>

      <View style={styles.nameWrapper}>
        <View style={styles.row}>
          <Text
            variant={"body"}
            fontWeight={"semiBold"}
            numberOfLines={1}
            style={styles.name}
          >
            {validator?.name ?? validatorAddress}
          </Text>
          {status === "bonded" ? (
            <CheckCircle size={12} color={colors.green} />
          ) : status === "activating" ? (
            <Clock size={12} color={colors.orange} />
          ) : null}
        </View>

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
  name: {
    flexShrink: 1,
    marginRight: 5,
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
