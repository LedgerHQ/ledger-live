import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Touchable from "../../components/Touchable";
import ValidatorImage from "./ValidatorImage";
import { AvalanchePChainValidator } from "@ledgerhq/live-common/families/avalanchepchain/types";
import { isDefaultValidatorNode } from "@ledgerhq/live-common/families/avalanchepchain/utils";

const ValidatorRow = ({
  onPress,
  validator,
  account,
  amount,
}: {
  onPress: (validator: AvalanchePChainValidator) => void;
  validator: AvalanchePChainValidator;
  account: AccountLike;
  amount: BigNumber;
}) => {
  const onPressT = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);

  return (
    <Touchable
      event="ChoseValidator"
      eventProperties={{
        validatorName: validator.nodeID,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage
          isLedger={isDefaultValidatorNode(validator.nodeID)}
          size={32}
          name={validator.nodeID.split("-")[1]}
        />
        <View style={styles.validatorBody}>
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            style={styles.validatorName}
          >
            {validator.nodeID}
          </Text>
        </View>
        <Text
          fontWeight="semiBold"
          numberOfLines={1}
          style={[styles.validatorYield]}
          color="smoke"
        >
          <Text fontWeight="semiBold" numberOfLines={1}>
            <CurrencyUnitValue
              showCode
              unit={getAccountUnit(account)}
              value={validator.remainingStake}
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
