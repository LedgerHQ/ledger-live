// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import type { T } from "../../types/common";

import colors from "../../colors";
import CheckCircle from "../../icons/CheckCircle";
import LText from "../../components/LText";
import Button from "../../components/Button";

type Props = {
  t: T,
  onClose: () => void,
  onViewDetails: () => void,
};

class ValidateSuccess extends PureComponent<Props> {
  render() {
    const { t, onClose, onViewDetails } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.icon}>
            <CheckCircle size={40} color={colors.success} />
          </View>
          <LText secondary semiBold style={styles.title}>
            {t("send.validation.sent")}
          </LText>
          <LText style={styles.message}>{t("send.validation.confirm")}</LText>
        </View>
        <View style={styles.actionContainer}>
          <Button
            title={t("common.close")}
            type="secondary"
            containerStyle={{ flex: 1, marginRight: 16 }}
            onPress={onClose}
          />
          <Button
            title={t("send.validation.button.details")}
            type="primary"
            containerStyle={{ flex: 1 }}
            onPress={onViewDetails}
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
    fontSize: 16,
    color: colors.darkBlue,
    paddingHorizontal: 16,
    paddingBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    paddingHorizontal: 16,
    color: colors.smoke,
    textAlign: "center",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default translate()(ValidateSuccess);
