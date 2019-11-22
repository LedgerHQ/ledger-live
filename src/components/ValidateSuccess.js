// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import colors from "../colors";
import CheckCircle from "../icons/CheckCircle";
import LText from "./LText";
import Button from "./Button";

type Props = {
  onClose?: () => void,
  onViewDetails?: () => void,
  title?: React$Node,
  description?: React$Node,
  primaryButton?: React$Node,
  secondaryButton?: React$Node,
};

class ValidateSuccess extends PureComponent<Props> {
  render() {
    const {
      onClose,
      onViewDetails,
      title,
      description,
      primaryButton,
      secondaryButton,
    } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.icon}>
            <CheckCircle size={40} color={colors.success} />
          </View>
          <LText secondary semiBold style={styles.title}>
            {title || <Trans i18nKey="send.validation.sent" />}
          </LText>
          <LText style={styles.message}>
            {description || <Trans i18nKey="send.validation.confirm" />}
          </LText>
          {primaryButton || (
            <Button
              event="SendSuccessViewDetails"
              title={<Trans i18nKey="send.validation.button.details" />}
              type="primary"
              containerStyle={styles.button}
              onPress={onViewDetails}
            />
          )}
          {secondaryButton || (
            <Button
              event="SendSuccessClose"
              title={<Trans i18nKey="common.close" />}
              type="lightSecondary"
              containerStyle={styles.button}
              onPress={onClose}
            />
          )}
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
    backgroundColor: colors.translucentGreen,
  },
  title: {
    fontSize: 18,
    color: colors.darkBlue,
    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  message: {
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    color: colors.smoke,
    textAlign: "center",
  },
});

export default ValidateSuccess;
