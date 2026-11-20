import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Delete } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

type NumberKeyboardProps = Readonly<{
  onKeyPress: (key: string) => void;
  allowDecimal?: boolean;
  compact?: boolean;
}>;

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "delete"],
];

const KEY_HEIGHT = 52;
const MIN_TOUCH_TARGET_HEIGHT = 48;

type Spacings = Readonly<{ s4: number }>;

function getRowPitch(spacings: Spacings, compact: boolean) {
  return compact
    ? { keyHeight: MIN_TOUCH_TARGET_HEIGHT, rowGap: 0 }
    : { keyHeight: KEY_HEIGHT, rowGap: spacings.s4 };
}

export function getNumberKeyboardCompactSaving(spacings: Spacings) {
  const regular = getRowPitch(spacings, false);
  const compact = getRowPitch(spacings, true);
  const savingPerRow = regular.keyHeight + regular.rowGap - compact.keyHeight - compact.rowGap;
  return KEYS.length * savingPerRow;
}

export function NumberKeyboard({
  onKeyPress,
  allowDecimal = true,
  compact = false,
}: NumberKeyboardProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flexShrink: 0,
        paddingTop: theme.spacings.s8,
      },
      row: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: getRowPitch(theme.spacings, compact).rowGap,
        paddingHorizontal: theme.spacings.s8,
      },
      key: {
        width: 72,
        height: getRowPitch(theme.spacings, compact).keyHeight,
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
    [compact],
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
              testID={
                key === "delete"
                  ? "keyboard-key-delete"
                  : key === "."
                    ? "keyboard-key-decimal"
                    : `keyboard-key-${key}`
              }
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
