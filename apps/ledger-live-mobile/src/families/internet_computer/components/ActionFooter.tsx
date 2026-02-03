import React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "~/components/LText";
import TranslatedError from "~/components/TranslatedError";

type Props = {
  error: Error | null | undefined;
  warning?: Error | null | undefined;
  onContinue: () => void;
  isDisabled: boolean;
  isPending: boolean;
  testID?: string;
  continueLabel?: string;
};

export default function ActionFooter({
  error,
  warning,
  onContinue,
  isDisabled,
  isPending,
  testID,
  continueLabel = "common.continue",
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.footer, { backgroundColor: colors.background }]}>
      <LText
        style={styles.fieldStatus}
        color={error ? "alert" : warning ? "orange" : "darkBlue"}
        numberOfLines={2}
      >
        <TranslatedError error={error || warning} />
      </LText>
      <Button
        type="main"
        onPress={onContinue}
        disabled={isDisabled}
        pending={isPending}
        testID={testID}
      >
        <Trans i18nKey={continueLabel} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
});
