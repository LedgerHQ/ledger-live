// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import colors from "../../colors";
import CheckCircle from "../../icons/CheckCircle";
import LText from "../../components/LText";
import Button from "../../components/Button";

type Props = {
  onClose: () => void,
  onViewDetails: () => void,
};

class ValidateSuccess extends PureComponent<Props> {
  render() {
    const { onClose, onViewDetails } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.icon}>
            <CheckCircle size={40} color={colors.success} />
          </View>
          <LText secondary semiBold style={styles.title}>
            <Trans i18nKey="send.validation.sent" />
          </LText>
          <LText style={styles.message}>
            <Trans i18nKey="send.validation.confirm" />
          </LText>
          <Button
            event="SendSuccessViewDetails"
            title={<Trans i18nKey="send.validation.button.details" />}
            type="primary"
            containerStyle={styles.button}
            onPress={onViewDetails}
          />
          <Button
            event="SendSuccessClose"
            title={<Trans i18nKey="common.close" />}
            type="lightSecondary"
            containerStyle={styles.button}
            onPress={onClose}
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
