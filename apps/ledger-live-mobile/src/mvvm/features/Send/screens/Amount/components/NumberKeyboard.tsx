import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Delete } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

type NumberKeyboardProps = Readonly<{
  onKeyPress: (key: string) => void;
  allowDecimal?: boolean;
}>;

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "delete"],
];

export function NumberKeyboard({ onKeyPress, allowDecimal = true }: NumberKeyboardProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        paddingVertical: theme.spacings.s8,
      },
      row: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: theme.spacings.s4,
        paddingHorizontal: theme.spacings.s8,
      },
      key: {
        width: 72,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
      },
      keyActive: {
        backgroundColor: theme.colors.bg.mutedTransparent,
      },
      deleteButton: {
        alignItems: "center",
        justifyContent: "center",
      },
    }),
    [],
  );

  const handlePress = (key: string) => {
    if (key === "." && !allowDecimal) return;
    onKeyPress(key);
  };

  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map(key => (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.key, pressed && styles.keyActive]}
              onPress={() => handlePress(key)}
              android_ripple={{ color: "rgba(255, 255, 255, 0.1)", borderless: false }}
            >
              {key === "delete" ? (
                <View style={styles.deleteButton}>
                  <Delete size={24} />
                </View>
              ) : (
                <Text typography="heading2" lx={{ color: "base" }}>
                  {key}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
