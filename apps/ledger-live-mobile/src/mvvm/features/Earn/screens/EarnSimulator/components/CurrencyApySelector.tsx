import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { DropdownMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTheme } from "styled-components/native";

type Props = {
  currencyName: string;
  apy: number;
  onPress: () => void;
};

/**
 *
 * TODO: Open modular asset drawer
 */
export default function CurrencyApySelector({ currencyName, apy, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: colors.neutral.c30 }]}>
      <View style={[styles.iconPlaceholder, { backgroundColor: colors.neutral.c50 }]} />
      <Text variant="small" fontWeight="semiBold" color="neutral.c100">
        {currencyName} · {apy} APY
      </Text>
      <DropdownMedium size={16} color={colors.neutral.c70} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 32,
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
