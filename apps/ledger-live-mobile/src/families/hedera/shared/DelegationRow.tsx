import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/color";
import { HederaDelegationWithMeta } from "@ledgerhq/live-common/families/hedera/types";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import ValidatorIcon from "./ValidatorIcon";

interface Props {
  onPress: (_: HederaDelegationWithMeta) => void;
  delegationWithMeta: HederaDelegationWithMeta;
  account: AccountLike;
}

const DelegationRow = ({ onPress, delegationWithMeta, account }: Props) => {
  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const claimableRewards = delegationWithMeta.pendingReward;

  const handlePress = useCallback(() => {
    onPress(delegationWithMeta);
  }, [delegationWithMeta, onPress]);

  return (
    <Touchable
      event="ClaimRewardsFlowChooseValidator"
      eventProperties={{ validatorName: delegationWithMeta.validator.name }}
      onPress={handlePress}
      disabled={claimableRewards.isZero()}
    >
      <View style={styles.root}>
        <ValidatorIcon color={color} size={32} validatorName={delegationWithMeta.validator.name} />
        <View style={styles.body}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.name}>
            {delegationWithMeta.validator.name}
          </Text>
        </View>
        <View style={{ flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
          <Text fontWeight="semiBold" numberOfLines={1} style={[styles.value]} color="smoke">
            <Text fontWeight="semiBold" numberOfLines={1}>
              <CurrencyUnitValue showCode unit={unit} value={claimableRewards} />
            </Text>
          </Text>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  body: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
  },
});

export default DelegationRow;
