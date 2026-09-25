import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Delete } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { AMOUNT_DELETE_KEY } from "./amountKeys";

type AmountKeypadProps = Readonly<{
  onKeyPress: (key: string) => void;
  deleteAccessibilityLabel: string;
}>;

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", AMOUNT_DELETE_KEY],
];

const KEY_TEST_ID_SUFFIXES: Record<string, string> = {
  ".": "decimal",
  [AMOUNT_DELETE_KEY]: "delete",
};

/** In-app numeric keypad: emits raw key presses and leaves building the amount to the caller. */
export function AmountKeypad({ onKeyPress, deleteAccessibilityLabel }: AmountKeypadProps) {
  const styles = useStyleSheet(
    theme => ({
      row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: theme.spacings.s4,
      },
      key: {
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: theme.borderRadius.full,
      },
      keyPressed: {
        backgroundColor: theme.colors.bg.mutedTransparent,
      },
    }),
    [],
  );

  return (
    <View>
      {KEY_ROWS.map(row => (
        <View key={row.join()} style={styles.row}>
          {row.map(key => (
            <Pressable
              key={key}
              testID={`card-top-up-key-${KEY_TEST_ID_SUFFIXES[key] ?? key}`}
              accessibilityLabel={key === AMOUNT_DELETE_KEY ? deleteAccessibilityLabel : key}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              onPress={() => onKeyPress(key)}
            >
              {key === AMOUNT_DELETE_KEY ? (
                <Delete size={24} />
              ) : (
                <Text typography="heading3" lx={{ color: "base" }}>
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
