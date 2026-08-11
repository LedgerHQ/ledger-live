import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Delete } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { AMOUNT_DELETE_KEY } from "../utils/amountKeys";

type AmountKeypadProps = Readonly<{
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}>;

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", AMOUNT_DELETE_KEY],
];

const KEY_TEST_IDS: Record<string, string> = {
  ".": "perps-deposit-key-decimal",
  [AMOUNT_DELETE_KEY]: "perps-deposit-key-delete",
};

export function AmountKeypad({ onKeyPress, disabled }: AmountKeypadProps) {
  const { t } = useTranslation();
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
              testID={KEY_TEST_IDS[key] ?? `perps-deposit-key-${key}`}
              accessibilityLabel={key === AMOUNT_DELETE_KEY ? t("perpsDeposit.keypadDelete") : key}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              onPress={() => onKeyPress(key)}
            >
              {key === AMOUNT_DELETE_KEY ? (
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
