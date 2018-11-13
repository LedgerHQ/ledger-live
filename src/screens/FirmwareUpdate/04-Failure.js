/* @flow */
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";

import TranslatedError from "../../components/TranslatedError";
import LText from "../../components/LText";
import ErrorIcon from "../../components/ErrorIcon";
import Button from "../../components/Button";
import NeedHelp from "../../components/NeedHelp";
import colors from "../../colors";

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
    error: Error,
  },
}>;

type Props = {
  navigation: Navigation,
};

type State = {};

class FirmwareUpdateFailure extends Component<Props, State> {
  static navigationOptions = {
    header: null,
  };

  onRetry = () => {
    this.props.navigation.navigate("FirmwareUpdateCheckId");
  };

  onClose = () => {
    this.props.navigation.dangerouslyGetParent().goBack();
  };

  render() {
    const { navigation } = this.props;
    const error = navigation.getParam("error");
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.body}>
          <View style={styles.icon}>
            <ErrorIcon size={40} error={error} />
          </View>
          <LText secondary semiBold style={styles.title} numberOfLines={3}>
            <TranslatedError error={error} />
          </LText>
          <LText style={styles.message} numberOfLines={6}>
            <TranslatedError error={error} field="description" />
          </LText>
          <Button
            type="primary"
            onPress={this.onRetry}
            title={<Trans i18nKey="common.retry" />}
            containerStyle={styles.button}
          />
          <Button
            type="secondary"
            onPress={this.onClose}
            title={<Trans i18nKey="common.close" />}
            containerStyle={styles.button}
          />
        </View>
        <View style={styles.footer}>
          <NeedHelp />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    padding: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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

export default translate()(FirmwareUpdateFailure);
