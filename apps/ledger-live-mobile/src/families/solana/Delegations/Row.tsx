import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { SolanaStakeWithMeta } from "@ledgerhq/live-common/families/solana/types";
import { sweetch } from "@ledgerhq/live-common/families/solana/utils";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import CounterValue from "~/components/CounterValue";
import ArrowRight from "~/icons/ArrowRight";
import CheckCircle from "~/icons/CheckCircle";
import Clock from "~/icons/Clock";
import ExclamationCircle from "~/icons/ExclamationCircle";
import ValidatorImage from "../shared/ValidatorImage";

type Props = {
  stakeWithMeta: SolanaStakeWithMeta;
  currency: Currency;
  unit: Unit;
  onPress: (_: SolanaStakeWithMeta) => void;
  isLast?: boolean;
};

export default function DelegationRow({
  stakeWithMeta,
  currency,
  unit,
  onPress,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { stake, meta } = stakeWithMeta;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        { backgroundColor: colors.card },
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={() => onPress(stakeWithMeta)}
    >
      <View style={[styles.icon]}>
        <ValidatorImage
          size={32}
          imgUrl={meta.validator?.img}
          name={meta.validator?.name ?? stake.delegation?.voteAccAddr}
        />
      </View>

      <View style={styles.nameWrapper}>
        <View style={styles.row}>
          <Text
            fontWeight="semiBold"
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{ marginRight: 5 }}
          >
            {meta.validator?.name ?? stake.delegation?.voteAccAddr ?? "-"}
          </Text>

          {sweetch(stake.activation.state, {
            activating: <Clock size={12} color={colors.orange} />,
            deactivating: <Clock size={12} color={colors.orange} />,
            active: <CheckCircle size={12} color={colors.green} />,
            inactive: <ExclamationCircle size={14} color={colors.alert} />,
          })}
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
          {formatCurrencyUnit(
            unit,
            new BigNumber((stake.delegation?.stake ?? 0) || stake.withdrawable),
            {
              showCode: true,
              disableRounding: true,
            },
          )}
        </Text>

        <Text color="grey">
          <CounterValue
            currency={currency}
            showCode={true}
            value={stake.delegation?.stake ?? 0}
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
