import type { ValidatorInfo } from "@ledgerhq/live-common/families/mina/types";
import { Text } from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Circle from "~/components/Circle";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import Touchable from "~/components/Touchable";
import { Unit } from "@ledgerhq/types-cryptoassets";

type Props = Readonly<{
  validator: ValidatorInfo;
  onPress: (validator: ValidatorInfo) => void;
  unit: Unit;
}>;

export default function ValidatorRow({ validator, onPress, unit }: Props) {
  const onPressT = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);

  return (
    <Touchable
      event="DelegationFlowChosevalidator"
      eventProperties={{
        validatorName: validator.name || validator.address,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <ValidatorImage name={validator.name ?? validator.address} />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.name || validator.address}
          </Text>
          <Text fontWeight="semiBold" numberOfLines={1} style={styles.commission}>
            <Trans i18nKey="mina.delegation.commission" /> {validator.fee}%
          </Text>
        </View>
        <Text fontWeight="semiBold" numberOfLines={1} style={styles.validatorYield} color="smoke">
          <CurrencyUnitValue showCode unit={unit} value={new BigNumber(validator.stake)} />
        </Text>
      </View>
    </Touchable>
  );
}

const ValidatorImage = ({ name, size = 32 }: { name?: string; size?: number }) => (
  <Circle crop size={size}>
    <FirstLetterIcon label={name ?? "-"} round size={size} fontSize={24} />
  </Circle>
);

export { ValidatorImage };

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
  validatorYield: {
    fontSize: 14,
  },
});
