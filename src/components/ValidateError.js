// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import GenericErrorView from "./GenericErrorView";
import Button from "./Button";
import NeedHelp from "./NeedHelp";
import colors from "../colors";

type Props = {
  error: Error,
  onClose: () => void,
  onRetry: null | (() => void),
};

class ValidateError extends PureComponent<Props> {
  render() {
    const { error, onClose, onRetry } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <GenericErrorView error={error} />
          {onRetry ? (
            <Button
              event="SendErrorRetry"
              title={<Trans i18nKey="send.validation.button.retry" />}
              type="primary"
              containerStyle={styles.button}
              onPress={onRetry}
            />
          ) : null}
          <Button
            event="SendErrorClose"
            title={<Trans i18nKey="common.close" />}
            type="lightSecondary"
            containerStyle={styles.button}
            onPress={onClose}
          />
        </View>
        <View style={styles.footer}>
          <NeedHelp />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
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
    borderColor: colors.lightFog,
  },
});

export default ValidateError;
