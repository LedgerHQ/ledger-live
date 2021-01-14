// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import { useTheme } from "@react-navigation/native";
import GenericErrorView from "./GenericErrorView";
import Button from "./Button";
import NeedHelp from "./NeedHelp";

type Props = {
  error: Error,
  onClose: () => void,
  onRetry: null | (() => void),
};

function ValidateError({ error, onClose, onRetry }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <GenericErrorView error={error} />
        <Button
          event="SendErrorRetry"
          title={<Trans i18nKey="send.validation.button.retry" />}
          type="primary"
          containerStyle={styles.button}
          onPress={onRetry}
        />
        <Button
          event="SendErrorClose"
          title={<Trans i18nKey="common.close" />}
          type="lightSecondary"
          containerStyle={styles.button}
          onPress={onClose}
        />
      </View>
      <View style={[styles.footer, { borderColor: colors.lightFog }]}>
        <NeedHelp />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});

export default memo<Props>(ValidateError);
