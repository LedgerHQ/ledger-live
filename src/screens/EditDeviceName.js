// @flow

import React, { PureComponent } from "react";
import { Buffer } from "buffer";
import { TextInput, View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import Icon from "react-native-vector-icons/dist/Feather";
import TransportBLE from "../react-native-hw-transport-ble";
import editDeviceName from "../logic/hw/editDeviceName";
import Button from "../components/Button";
import LText, { getFontStyle } from "../components/LText";
import TranslatedError from "../components/TranslatedError";
import KeyboardView from "../components/KeyboardView";
import colors from "../colors";
import { deviceNameByNavigationDeviceIdSelector } from "../reducers/ble";
import { saveBleDeviceName } from "../actions/ble";

const MAX_DEVICE_NAME = 32;

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

class EditDeviceName extends PureComponent<
  {
    navigation: NavigationScreenProp<*>,
    saveBleDeviceName: (string, string) => *,
    name: string,
    t: *,
  },
  {
    name: string,
    error: ?Error,
  },
> {
  static navigationOptions = {
    title: "Edit Device Name",
  };

  initialName = this.props.name;

  state = {
    name: this.props.name,
    error: null,
  };

  onChangeText = (name: string) => {
    this.setState({ name });
  };

  onSubmit = async () => {
    const { name } = this.state;
    const deviceId = this.props.navigation.getParam("deviceId");
    if (this.initialName !== name) {
      try {
        const transport = await TransportBLE.open(deviceId);
        await editDeviceName(transport, name);
        transport.close();
        this.props.saveBleDeviceName(deviceId, name);
      } catch (error) {
        console.warn(error);
        this.setState({ error });
        return;
      }
    }
    this.props.navigation.goBack();
  };

  render() {
    const { name, error } = this.state;
    const { t } = this.props;
    const remainingCount = MAX_DEVICE_NAME - Buffer.from(name).length;
    return (
      <KeyboardView style={styles.root}>
        <View style={styles.body}>
          <TextInput
            value={name}
            onChangeText={this.onChangeText}
            maxLength={MAX_DEVICE_NAME}
            autoFocus
            autoCorrect
            selectTextOnFocus
            clearButtonMode="always"
            placeholder={t("EditDeviceName.placeholder")}
            returnKeyType="done"
            style={[getFontStyle({ semiBold: true }), styles.input]}
          />
          <LText style={styles.remainingText}>
            {t("EditDeviceName.charactersRemaining", { remainingCount })}
          </LText>
        </View>
        <View style={styles.footer}>
          {error ? <FooterError error={error} /> : null}
          <Button
            type="primary"
            title={t("EditDeviceName.action")}
            onPress={this.onSubmit}
          />
        </View>
      </KeyboardView>
    );
  }
}

export default connect(
  createStructuredSelector({
    name: deviceNameByNavigationDeviceIdSelector,
  }),
  {
    saveBleDeviceName,
  },
)(translate()(EditDeviceName));

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: 20,
  },
  input: {
    fontSize: 22,
  },
  remainingText: {
    color: colors.grey,
    fontSize: 14,
    marginTop: 4,
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
