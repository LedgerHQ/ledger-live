// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import Button from "../../../../components/Button";
import colors from "../../../../colors";
import { useKeyboardVisible } from "../../../../logic/keyboardVisible";

export default function SelectValidatorFooter({
  disabled,
  onContinue,
}: {
  disabled: boolean,
  onContinue: () => void,
}) {
  const isKeyBoardVisible = useKeyboardVisible();

  if (isKeyBoardVisible) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
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
    borderTopColor: colors.lightGrey,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  remainingWrapper: {
    marginBottom: 16,
  },
  remainingText: {
    color: colors.grey,
  },
  remainingCount: {
    color: colors.darkBlue,
  },
});
