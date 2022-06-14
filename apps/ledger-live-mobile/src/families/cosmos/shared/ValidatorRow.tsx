import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { CosmosValidatorItem } from "@ledgerhq/live-common/lib/families/cosmos/types";
import { LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/lib/families/cosmos/utils";
import { AccountLike } from "@ledgerhq/live-common/lib/types";
import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import Touchable from "../../../components/Touchable";
import ValidatorImage from "./ValidatorImage";

const ValidatorRow = ({
  onPress,
  validator,
  account,
}: {
  onPress: (v: CosmosValidatorItem) => void;
  validator: CosmosValidatorItem;
  account: AccountLike;
}) => {
  const onPressT = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);

  return (
    <Touchable
      event="DelegationFlowChosevalidator"
      eventProperties={{
        validatorName: validator.name || validator.validatorAddress,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage
          isLedger={LEDGER_VALIDATOR_ADDRESS === validator.validatorAddress}
          size={32}
          name={validator.name ?? validator.validatorAddress}
        />
        <View style={styles.validatorBody}>
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            style={styles.validatorName}
          >
            {validator.name || validator.validatorAddress}
          </Text>
          {true ? (
            <Text
              fontWeight="semiBold"
              numberOfLines={1}
              style={styles.overdelegated}
            >
              <Trans i18nKey="cosmos.delegation.commission" />{" "}
              {validator.commission * 100} %
            </Text>
          ) : null}
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
              value={validator.tokens}
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
