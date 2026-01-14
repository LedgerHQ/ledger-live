import { BigNumber } from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import ValidatorImage from "./ValidatorImage";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { SuiValidator } from "@ledgerhq/live-common/families/sui/types";

const ValidatorRow = ({
  onPress,
  validator,
  account,
}: {
  onPress: (_: SuiValidator) => void;
  validator: SuiValidator;
  account: AccountLike;
}) => {
  const onPressT = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);
  const unit = useAccountUnit(account);
  return (
    <Touchable
      event="DelegationFlowChosevalidator"
      eventProperties={{
        validatorName: validator.suiAddress,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage size={32} name={validator.name} url={validator.imageUrl} />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.name}
          </Text>
          {validator.commissionRate ? (
            <Text fontWeight="semiBold" numberOfLines={1} style={styles.overdelegated}>
              <Trans i18nKey="sui.staking.commission" /> {Number(validator.commissionRate) / 100}%
            </Text>
          ) : null}
        </View>
        <Text fontWeight="semiBold" numberOfLines={1} style={[styles.validatorYield]} color="smoke">
          <Text fontWeight="semiBold" numberOfLines={1}>
            <CurrencyUnitValue
              showCode
              unit={unit}
              value={new BigNumber(validator.stakingPoolSuiBalance)}
            />
          </Text>
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
  overdelegatedIndicator: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 34,
    left: 24,
    borderWidth: 1,
  },
  overdelegated: {
    fontSize: 12,
  },
  validatorYield: {
    fontSize: 14,
  },
  validatorYieldFull: {
    opacity: 0.5,
  },
});

export default ValidatorRow;
