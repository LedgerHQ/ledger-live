import React, { type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = Readonly<{
  label: string;
  lastUpdateLabel?: string;
  balance: ReactNode;
  selected: boolean;
  onPress: () => void;
}>;

export function BalanceCard({ label, lastUpdateLabel, balance, selected, onPress }: Props) {
  const styles = useStyleSheet(
    t => ({
      card: {
        flexDirection: "row",
        alignItems: "center",
        padding: t.spacings.s12,
        gap: t.spacings.s12,
        borderRadius: t.borderRadius.sm,
        borderWidth: t.borderWidth.s1,
        overflow: "hidden",
        minHeight: 64,
      },
      cardDefault: {
        backgroundColor: t.colors.bg.muted,
        borderColor: "transparent",
      },
      cardSelected: {
        backgroundColor: t.colors.bg.activeSubtle,
        borderColor: t.colors.border.active,
      },
      cardPressed: {
        backgroundColor: t.colors.bg.surfacePressed,
      },
      content: {
        flex: 1,
        alignSelf: "stretch",
        justifyContent: "center",
        gap: t.spacings.s4,
      },
    }),
    [],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : styles.cardDefault,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.content}>
        <Text typography="body2SemiBold" lx={{ color: "base" }} numberOfLines={1}>
          {label}
        </Text>
        {lastUpdateLabel && (
          <Text typography="body3" lx={{ color: "muted" }} numberOfLines={1}>
            {lastUpdateLabel}
          </Text>
        )}
      </View>
      <Text
        typography="body2SemiBold"
        lx={{ color: "base" }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {balance}
      </Text>
    </Pressable>
  );
}
