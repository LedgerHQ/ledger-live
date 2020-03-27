// @flow

import React, { PureComponent } from "react";
import { Keyboard, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { compose } from "redux";
import { connect } from "react-redux";
import { DeviceNameInvalid } from "@ledgerhq/errors";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import colors from "../colors";
import { TrackScreen } from "../analytics";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import LText, { getFontStyle } from "../components/LText";
import TranslatedError from "../components/TranslatedError";
import KeyboardView from "../components/KeyboardView";
import { editDeviceName, connectingStep } from "../components/DeviceJob/steps";
import DeviceJob from "../components/DeviceJob";
import { saveBleDeviceName } from "../actions/ble";

const MAX_DEVICE_NAME = 32;

const forceInset = { bottom: "always" };

class FooterError extends PureComponent<{ error: Error }> {
  render() {
    const { error } = this.props;
    return (
      <LText style={styles.error} numberOfLines={2}>
        <Icon color={colors.alert} size={16} name="alert-triangle" />{" "}
        <TranslatedError error={error} />
      </LText>
    );
  }
}
const mapDispatchToProps = {
  saveBleDeviceName,
};

class EditDeviceName extends PureComponent<
  {
    navigation: NavigationScreenProp<{
      params: {
        deviceId: string,
        deviceName: string,
      },
    }>,
    deviceName: string,
    saveBleDeviceName: (string, string) => *,
  },
  {
    name: string,
    error: ?Error,
    connecting: ?Device,
  },
> {
  static navigationOptions = {
    title: i18next.t("EditDeviceName.title"),
    headerLeft: null,
  };

  initialName = this.props.navigation.getParam("deviceName");

  state = {
    name: this.initialName,
    error: null,
    connecting: null,
  };

  onChangeText = (name: string) => {
    this.setState({ name }, this.validate);
  };

  onInputCleared = () => {
    this.setState({ name: "" });
  };

  validate = () => {
    this.setState(prevState => {
      const invalidCharacters = prevState.name.replace(/[\x00-\x7F]*/g, "");
      return {
        error: invalidCharacters
          ? new DeviceNameInvalid("", { invalidCharacters })
          : undefined,
      };
    });
  };

  onSubmit = async () => {
    const { name } = this.state;
    if (this.initialName !== name) {
      Keyboard.dismiss();
      setTimeout(
        () =>
          this.setState(prevState => ({
            name: prevState.name.trim(),
            connecting: {
              deviceId: this.props.navigation.getParam("deviceId"),
              deviceName: prevState.name.trim(),
              modelId: "nanoX",
              wired: false,
            },
          })),
        800,
      );
    } else {
      this.props.navigation.goBack();
    }
  };

  onCancel = () => {
    this.setState({ connecting: null });
  };

  onDone = () => {
    const { saveBleDeviceName, navigation } = this.props;
    saveBleDeviceName(navigation.getParam("deviceId"), this.state.name);
    this.props.navigation.goBack();
  };

  render() {
    const { name, error, connecting } = this.state;
    const remainingCount = MAX_DEVICE_NAME - name.length;
    return (
      <SafeAreaView style={styles.safearea} forceInset={forceInset}>
        <TrackScreen category="EditDeviceName" />
        <KeyboardView style={styles.root}>
          <View style={styles.body}>
            <TextInput
              value={name}
              onChangeText={this.onChangeText}
              onInputCleared={this.onInputCleared}
              maxLength={MAX_DEVICE_NAME}
              autoFocus
              selectTextOnFocus
              blurOnSubmit={false}
              clearButtonMode="always"
              placeholder="Satoshi Nakamoto"
              style={[getFontStyle({ semiBold: true }), styles.input]}
            />
            <LText style={styles.remainingText}>
              <Trans
                i18nKey="EditDeviceName.charactersRemaining"
                values={{ remainingCount }}
              />
            </LText>
          </View>
          <View style={styles.footer}>
            {error ? <FooterError error={error} /> : null}
            <Button
              event="EditDeviceNameSubmit"
              type="primary"
              title={<Trans i18nKey="EditDeviceName.action" />}
              onPress={this.onSubmit}
              disabled={!name.trim() || !!error}
            />
          </View>

          <DeviceJob
            deviceModelId="nanoX" // NB: EditDeviceName feature is only available on NanoX over BLE.
            meta={connecting}
            onCancel={this.onCancel}
            onDone={this.onDone}
            steps={[connectingStep, editDeviceName(name)]}
          />
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

export default compose(
  connect(
    null,
    mapDispatchToProps,
  ),
  translate(),
)(EditDeviceName);

const styles = StyleSheet.create({
  safearea: {
    backgroundColor: colors.white,
    flex: 1,
  },
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 24,
  },
  remainingText: {
    color: colors.grey,
    fontSize: 14,
    marginTop: 10,
  },
  error: {
    alignSelf: "center",
    color: colors.alert,
    fontSize: 14,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "column",
    padding: 20,
  },
});
