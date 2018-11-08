// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import colors from "../../colors";

import LText from "../../components/LText";
import ErrorIcon from "../../components/ErrorIcon";
import TranslatedError from "../../components/TranslatedError";
import Button from "../../components/Button";
import ExternalLink from "../../components/ExternalLink";

type Props = {
  error: Error,
  onContactUs: () => void,
  onClose: () => void,
  onRetry: () => void,
};

class ValidatError extends PureComponent<Props> {
  render() {
    const { error, onContactUs, onClose, onRetry } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.icon}>
            <ErrorIcon size={40} error={error} />
          </View>
          <LText secondary semiBold style={styles.title} numberOfLines={3}>
            <TranslatedError error={error} />
          </LText>
          <LText style={styles.message} numberOfLines={6}>
            <TranslatedError error={error} field="description" />
          </LText>
          <ExternalLink
            text={<Trans i18nKey="common.contactUs" />}
            onPress={onContactUs}
          />
        </View>
        <View style={styles.actionContainer}>
          <Button
            title={<Trans i18nKey="common.close" />}
            type="secondary"
            containerStyle={{ flex: 1, marginRight: 16 }}
            onPress={onClose}
          />
          <Button
            title={<Trans i18nKey="send.validation.button.retry" />}
            type="primary"
            containerStyle={{ flex: 1 }}
            onPress={onRetry}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    padding: 20,
    marginBottom: 32,
    borderRadius: 46,
    backgroundColor: colors.lightAlert,
  },
  title: {
    fontSize: 16,
    color: colors.darkBlue,
    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 32,
    color: colors.smoke,
    textAlign: "center",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default ValidatError;
