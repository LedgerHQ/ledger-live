// @flow
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";

type Props = {
  address: string,
  name: string,
  formattedAmount: string,
  onPress: (address: string) => void,
};

export default function DelegationInfo({
  address,
  name,
  formattedAmount,
  onPress,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrapper, { borderLeftColor: colors.fog }]}>
      <LText style={styles.greyText}>
        <Trans
          i18nKey="operationDetails.extra.delegatedTo"
          values={{
            amount: formattedAmount,
            name,
          }}
        >
          <LText semiBold>text</LText>
        </Trans>
      </LText>

      <TouchableOpacity onPress={() => onPress(address)}>
        <LText style={styles.greyText} color="grey">
          {address}
        </LText>
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
