import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { StyleSheet } from "react-native";
import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/live-common/lib/types";
import CurrencyInput from "../../../../components/CurrencyInput";
import TranslatedError from "../../../../components/TranslatedError";

interface Props {
  value?: BigNumber;
  editable: boolean;
  unit?: Unit;
  onChange: (val: BigNumber) => void;
  fromAmountError?: string;
}

export function AmountInput({
  value,
  onChange,
  editable,
  unit,
  fromAmountError,
}: Props) {
  if (!unit) {
    return <Text>0</Text>;
  }

  return (
    <Flex alignItems="flex-end">
      <CurrencyInput
        editable={editable}
        onChange={onChange}
        unit={unit}
        value={value}
        inputStyle={styles.inputText}
        hasError={!!fromAmountError}
        dynamicFontRatio={0.3}
      />

      <Text color="error.c100">
        {/* @ts-expect-error */}
        <TranslatedError error={fromAmountError} />
      </Text>
    </Flex>
  );
}

const styles = StyleSheet.create({
  inputText: {
    textAlign: "right",
  },
});
