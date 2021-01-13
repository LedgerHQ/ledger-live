// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import Button from "../../../../components/Button";
import { useKeyboardVisible } from "../../../../logic/keyboardVisible";

export default function SelectValidatorFooter({
  disabled,
  onContinue,
}: {
  disabled: boolean,
  onContinue: () => void,
}) {
  const { colors } = useTheme();
  const isKeyBoardVisible = useKeyboardVisible();

  if (isKeyBoardVisible) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { borderTopColor: colors.lightGrey }]}>
      <View style={styles.continueWrapper}>
        <Button
          event="SelectValidatorContinue"
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          onPress={onContinue}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
