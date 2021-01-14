// @flow

import React, { PureComponent } from "react";
import { Keyboard, View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { connect } from "react-redux";
import { DeviceNameInvalid } from "@ledgerhq/errors";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { compose } from "redux";
import { TrackScreen } from "../analytics";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import LText, { getFontStyle } from "../components/LText";
import TranslatedError from "../components/TranslatedError";
import KeyboardView from "../components/KeyboardView";
import { editDeviceName, connectingStep } from "../components/DeviceJob/steps";
import DeviceJob from "../components/DeviceJob";
import { saveBleDeviceName } from "../actions/ble";
import { withTheme } from "../colors";

const MAX_DEVICE_NAME = 32;

const forceInset = { bottom: "always" };

function FooterError({ error, colors }: { error: Error, colors: * }) {
  return (
    <LText style={styles.error} color="alert" numberOfLines={2}>
      <Icon color={colors.alert} size={16} name="alert-triangle" />{" "}
      <TranslatedError error={error} />
    </LText>
  );
}
const mapDispatchToProps = {
  saveBleDeviceName,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
  deviceName: string,
  saveBleDeviceName: (string, string) => void,
  colors: *,
};

type RouteParams = {
  deviceId: string,
  deviceName: string,
};

class EditDeviceName extends PureComponent<
  Props,
  {
    name: string,
    error: ?Error,
    connecting: ?Device,
  },
> {
  initialName = this.props.route.params?.deviceName;

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
              deviceId: this.props.route.params?.deviceId,
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
    const { saveBleDeviceName, route } = this.props;
    saveBleDeviceName(route.params?.deviceId, this.state.name);
    this.props.navigation.goBack();
  };

  render() {
    const { colors } = this.props;
    const { name, error, connecting } = this.state;
    const remainingCount = MAX_DEVICE_NAME - name.length;

    return (
      <SafeAreaView
        style={[styles.safearea, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
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
              style={[
                getFontStyle({ semiBold: true }),
                styles.input,
                { color: colors.darkBlue },
              ]}
            />
            <LText style={styles.remainingText} color="grey">
              <Trans
                i18nKey="EditDeviceName.charactersRemaining"
                values={{ remainingCount }}
              />
            </LText>
          </View>
          <View style={styles.footer}>
            {error ? <FooterError error={error} colors={colors} /> : null}
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

// $FlowFixMe
export default compose(
  connect(null, mapDispatchToProps),
  withTheme,
)(EditDeviceName);

const styles = StyleSheet.create({
  safearea: {
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
    fontSize: 14,
    marginTop: 10,
  },
  error: {
    alignSelf: "center",
    fontSize: 14,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "column",
    padding: 20,
  },
});
