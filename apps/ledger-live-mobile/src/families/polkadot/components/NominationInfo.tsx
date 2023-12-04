import { useTheme } from "styled-components/native";
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import LText from "../../../components/LText";

type Props = {
  address: string;
  identity: string | null | undefined;
  onPress: (address: string) => void;
};
export default function NominationInfo({ address, identity, onPress }: Props) {
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
      {identity ? (
        <LText color="neutral.c70">
          <LText semiBold>{identity}</LText>
        </LText>
      ) : null}

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
