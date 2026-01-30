import React, { useCallback } from "react";
import { View, Pressable } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Delete } from "@ledgerhq/lumen-ui-rnative/symbols";

type NumericKeypadProps = Readonly<{
  onKeyPress: (key: string) => void;
  maxDecimalLength: number;
}>;

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
];

export function NumericKeypad({ onKeyPress, maxDecimalLength }: NumericKeypadProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: theme.spacings.s16,
      },
      row: {
        flexDirection: "row" as const,
        gap: theme.spacings.s12,
        marginBottom: theme.spacings.s12,
      },
      key: {
        flex: 1,
        aspectRatio: 1,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        borderRadius: theme.radii.r12,
      },
      keyText: {
        fontSize: 24,
        fontWeight: "600" as const,
        color: theme.colors.text.base,
      },
    }),
    [],
  );

  const handlePress = useCallback(
    (key: string) => {
      onKeyPress(key);
    },
    [onKeyPress],
  );

  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map(key => (
            <Pressable
              key={key}
              style={styles.key}
              onPress={() => handlePress(key)}
              accessibilityRole="button"
              accessibilityLabel={key === "backspace" ? "Delete" : key}
            >
              {key === "backspace" ? (
                <Delete size={28} />
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
