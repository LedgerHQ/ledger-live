import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { AvalancheDelegation } from "@ledgerhq/live-common/families/avalanchepchain/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import { isDefaultValidatorNode } from "@ledgerhq/live-common/families/avalanchepchain/utils";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import ValidatorImage from "../../cosmos/shared/ValidatorImage";
import LText from "../../../components/LText";
import ArrowRight from "../../../icons/ArrowRight";
import CounterValue from "../../../components/CounterValue";

type Props = {
  account: Account;
  delegation: AvalancheDelegation;
  currency: Currency;
  onPress: (delegation: AvalancheDelegation) => void;
  isLast?: boolean;
};

export default function DelegationRow({
  account,
  delegation,
  currency,
  onPress,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { nodeID, stakeAmount } = delegation;

  const formatAmount = (amount: string) => {
    const unit = getAccountUnit(account);
    return formatCurrencyUnit(unit, new BigNumber(amount), {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    });
  };

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
      <View style={[styles.icon]}>
        <ValidatorImage
          size={42}
          isLedger={isDefaultValidatorNode(nodeID)}
          name={nodeID}
        />
      </View>

      <View style={styles.nameWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
          {nodeID}
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
          {formatAmount(stakeAmount)}
        </Text>

        <LText color="grey">
          <CounterValue
            currency={currency}
            showCode
            value={stakeAmount}
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
