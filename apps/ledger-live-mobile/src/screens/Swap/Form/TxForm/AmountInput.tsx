import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { StyleSheet } from "react-native";
import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/live-common/lib/types";
import CurrencyInput from "../../../../components/CurrencyInput";

interface Props {
  value?: BigNumber;
  editable: boolean;
  unit?: Unit;
  onChange: (val: BigNumber) => void;
}

export function AmountInput({ value, onChange, editable, unit }: Props) {
  if (!unit) {
    return <Text>0</Text>;
  }

  return (
    <CurrencyInput
      editable={editable}
      onChange={onChange}
      unit={unit}
      value={value}
      inputStyle={styles.inputText}
      // TODO
      // hasError={!hideError && !!fromAmountError}
      dynamicFontRatio={0.3}
    />
  );
}

const styles = StyleSheet.create({
  inputText: {
    textAlign: "right",
  },
});
