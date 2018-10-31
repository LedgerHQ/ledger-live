// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import type { T } from "../../types/common";

import colors from "../../colors";

import LText from "../../components/LText";
import Button from "../../components/Button";
import Warning from "../../icons/Warning";

type Props = {
  t: T,
  onContactUs: () => void,
  onClose: () => void,
};

class ValidatError extends PureComponent<Props> {
  render() {
    const { t, onContactUs, onClose } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.icon}>
            <Warning size={40} color={colors.alert} />
          </View>
          <LText secondary semiBold style={styles.title}>
            {t("send.validation.refused")}
          </LText>
          <LText style={styles.message}>{t("send.validation.retry")}</LText>
        </View>
        <View style={styles.actionContainer}>
          <Button
            title={t("common.close")}
            type="secondary"
            containerStyle={{ flex: 1, marginRight: 16 }}
            onPress={onClose}
          />
          {/*
            TODO: THERE IS A SUGGESTION TO USE CLOSE HERE INSTEAD OF A RETRY BUTTON
            CHECK https://app.zeplin.io/project/5a6eed140b9285a37546f392/screen/5bbcd1b1e2c97b18e12643ee
            NEEDS DISCUSSION
           */}
          <Button
            title={t("common.contactUs")}
            type="primary"
            containerStyle={{ flex: 1 }}
            onPress={onContactUs}
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
    color: colors.smoke,
    textAlign: "center",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default translate()(ValidatError);
