import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";

interface Props {
  text: string;
}

export default function ReadonlyAmountRatio({ text }: Readonly<Props>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.ratioButton, { backgroundColor: colors.primary }]}>
      <Text textAlign="center">{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ratioButton: {
    marginTop: 16,
    height: 43,
    width: 70,
    borderRadius: 4,
    alignSelf: "center",
    justifyContent: "center",
  },
});
