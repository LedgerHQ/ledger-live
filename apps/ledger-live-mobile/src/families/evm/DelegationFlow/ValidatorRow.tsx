import type { StakingValidatorItem } from "@ledgerhq/coin-evm/types/index";
import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans } from "~/context/Locale";
import { StyleSheet, View } from "react-native";
import Touchable from "~/components/Touchable";
import ValidatorImage from "../shared/ValidatorImage";

const ValidatorRow = ({
  onPress,
  validator,
}: {
  onPress: (_: StakingValidatorItem) => void;
  validator: StakingValidatorItem;
}) => {
  const onPressT = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);

  return (
    <Touchable
      event="EvmDelegationFlowChoseValidator"
      eventProperties={{
        validatorName: validator.name || validator.validatorAddress,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage
          isLedger={false}
          size={32}
          name={validator.name ?? validator.validatorAddress}
        />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.name || validator.validatorAddress}
          </Text>
          <Text fontWeight="semiBold" numberOfLines={1} style={styles.commission}>
            <Trans i18nKey="evm.delegation.flow.steps.validator.commission" />{" "}
            {(validator.commission * 100).toFixed(2)} %
          </Text>
        </View>
        <Text fontWeight="semiBold" numberOfLines={1} style={styles.apr} color="smoke">
          {(validator.estimatedYearlyRewardsRate * 100).toFixed(2)} % APR
        </Text>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  validator: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  validatorBody: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  validatorName: {
    fontSize: 14,
  },
  commission: {
    fontSize: 12,
  },
  apr: {
    fontSize: 14,
  },
});

export default ValidatorRow;
