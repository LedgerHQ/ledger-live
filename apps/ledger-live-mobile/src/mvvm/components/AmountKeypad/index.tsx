import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Delete } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

export const KEYPAD_DELETE_KEY = "delete";

type AmountKeypadProps = Readonly<{
  onKeyPress: (key: string) => void;
  testIDPrefix: string;
  deleteAccessibilityLabel: string;
  disabled?: boolean;
}>;

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", KEYPAD_DELETE_KEY],
];

const KEY_TEST_ID_SUFFIXES: Record<string, string> = {
  ".": "decimal",
  [KEYPAD_DELETE_KEY]: "delete",
};

/**
 * In-app numeric keypad for amount entry. Emits raw key presses, including
 * `KEYPAD_DELETE_KEY`, and leaves it to the caller to build the amount text.
 */
export function AmountKeypad({
  onKeyPress,
  testIDPrefix,
  deleteAccessibilityLabel,
  disabled,
}: AmountKeypadProps) {
  const styles = useStyleSheet(
    theme => ({
      row: {
        flexDirection: "row",
        marginBottom: theme.spacings.s4,
      },
      key: {
        flex: 1,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
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
              disabled={disabled}
              testID={`${testIDPrefix}-${KEY_TEST_ID_SUFFIXES[key] ?? key}`}
              accessibilityLabel={key === KEYPAD_DELETE_KEY ? deleteAccessibilityLabel : key}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              onPress={() => onKeyPress(key)}
            >
              {key === KEYPAD_DELETE_KEY ? (
                <Delete size={24} />
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
