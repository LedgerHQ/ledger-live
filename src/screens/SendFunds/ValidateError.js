// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import type { T } from "../../types/common";

import colors from "../../colors";

import LText from "../../components/LText";
import ErrorIcon from "../../components/ErrorIcon";
import TranslatedError from "../../components/TranslatedError";
import Button from "../../components/Button";

type Props = {
  t: T,
  error: Error,
  onContactUs: () => void,
  onClose: () => void,
};

class ValidatError extends PureComponent<Props> {
  render() {
    const { t, error, onContactUs, onClose } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.icon}>
            <ErrorIcon size={40} error={error} />
          </View>
          <LText secondary semiBold style={styles.title}>
            <TranslatedError error={error} />
          </LText>
          <LText style={styles.message}>
            <TranslatedError error={error} field="description" />
          </LText>
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
