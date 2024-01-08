import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { NearValidatorItem } from "@ledgerhq/live-common/families/near/types";
import { FIGMENT_NEAR_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/near/constants";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import ValidatorImage from "./ValidatorImage";

const ValidatorRow = ({
  onPress,
  validator,
  account,
}: {
  onPress: (_: NearValidatorItem) => void;
  validator: NearValidatorItem;
  account: AccountLike;
}) => {
  const onPressT = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);

  return (
    <Touchable
      event="DelegationFlowChosevalidator"
      eventProperties={{
        validatorName: validator.validatorAddress,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage
          isLedger={FIGMENT_NEAR_VALIDATOR_ADDRESS === validator.validatorAddress}
          size={32}
          name={validator.validatorAddress}
        />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.validatorAddress}
          </Text>
          {validator.commission ? (
            <Text fontWeight="semiBold" numberOfLines={1} style={styles.overdelegated}>
              <Trans i18nKey="near.staking.commission" /> {validator.commission}%
            </Text>
          ) : null}
        </View>
        <Text fontWeight="semiBold" numberOfLines={1} style={[styles.validatorYield]} color="smoke">
          <Text fontWeight="semiBold" numberOfLines={1}>
            <CurrencyUnitValue
              showCode
              unit={getAccountUnit(account)}
              value={new BigNumber(validator.tokens)}
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
