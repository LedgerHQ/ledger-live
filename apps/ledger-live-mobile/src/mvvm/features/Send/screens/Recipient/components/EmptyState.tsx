import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Spot } from "@ledgerhq/lumen-ui-rnative";
import { Clock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

export function EmptyState() {
  const { t } = useTranslation();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Spot appearance="icon" icon={Clock} size={72} />
      <Text style={styles.text}>{t("newSendFlow.recentSendWillAppear")}</Text>
    </View>
  );
}

const useStyles = () =>
  useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacings.s24,
        gap: theme.spacings.s16,
      },
      text: StyleSheet.flatten([
        theme.typographies.body2,
        {
          color: theme.colors.text.muted,
          textAlign: "center",
        },
      ]),
    }),
    [],
  );
