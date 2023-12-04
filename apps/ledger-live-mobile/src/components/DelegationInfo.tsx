import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "styled-components/native";
import LText from "./LText";

type Props = {
  address: string;
  name: string;
  formattedAmount: string;
  onPress: (_: string) => void;
};
export default function DelegationInfo({ address, name, formattedAmount, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.wrapper,
        {
          borderLeftColor: colors.neutral.c70,
        },
      ]}
    >
      <LText color="neutral.c70">
        <Trans
          i18nKey="operationDetails.extra.delegatedTo"
          values={{
            amount: formattedAmount,
            name,
          }}
        >
          <LText semiBold>PLACEHOLDER_TEXT</LText>
        </Trans>
      </LText>

      <TouchableOpacity onPress={() => onPress(address)}>
        <LText color="neutral.c70">{address}</LText>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    borderLeftWidth: 3,
    paddingLeft: 16,
    marginBottom: 24,
  },
});
