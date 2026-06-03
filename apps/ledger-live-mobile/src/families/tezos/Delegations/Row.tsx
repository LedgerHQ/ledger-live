import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import type BigNumber from "bignumber.js";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import type { Baker } from "@ledgerhq/live-common/families/tezos/types";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { Text } from "@ledgerhq/native-ui";
import CounterValue from "~/components/CounterValue";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import LText from "~/components/LText";
import ArrowRight from "~/icons/ArrowRight";
import BakerImage from "../BakerImage";

type Props = Readonly<{
  baker?: Baker | null;
  address: string;
  amount: BigNumber;
  unit: Unit;
  currency: Currency;
  onPress: () => void;
  isLast?: boolean;
  statusLabel?: string;
}>;

export default function DelegationRow({
  baker,
  address,
  amount,
  unit,
  currency,
  onPress,
  isLast = false,
  statusLabel,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      testID="tezos-delegation-row"
      style={[
        styles.row,
        styles.wrapper,
        isLast ? undefined : { ...styles.borderBottom, borderBottomColor: colors.lightGrey },
      ]}
      onPress={onPress}
    >
      <View style={styles.icon}>
        <BakerImage size={42} baker={baker} />
      </View>

      <View style={styles.nameWrapper}>
        <View style={styles.row}>
          <Text variant="body" fontWeight="semiBold" numberOfLines={1} style={styles.name}>
            {baker?.name ?? shortAddressPreview(address)}
          </Text>
          {statusLabel ? (
            <LText style={styles.statusLabel} color="grey" numberOfLines={1}>
              {statusLabel}
            </LText>
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
        <Text variant="body" fontWeight="semiBold">
          <CurrencyUnitValue value={amount} unit={unit} showCode />
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
    paddingHorizontal: 16,
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
  name: {
    flexShrink: 1,
  },
  statusLabel: {
    fontSize: 12,
    marginLeft: 6,
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
