// @flow

import React, { Component } from "react";
import { StyleSheet, TouchableOpacity, View, Linking } from "react-native";
import { BleErrorCode } from "react-native-ble-plx";
import Icon from "react-native-vector-icons/dist/Feather";
import { Trans } from "react-i18next";
import LocationRequired from "../LocationRequired";
import LText from "../../components/LText";
import Button from "../../components/Button";
import TranslatedError from "../../components/TranslatedError";
import BluetoothScanning from "../../components/BluetoothScanning";
import { PairingFailed, GenuineCheckFailed } from "../../errors";
import colors from "../../colors";
import { urls } from "../../config/urls";
import Help from "../../icons/Help";

type Props = {
  error: Error,
  status: string,
  onRetry: () => void,
  onBypassGenuine: () => void,
};

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

const GenericErrorHeader = () => (
  <LText>
    <Icon name="alert-triangle" size={32} color={colors.alert} />
  </LText>
);

const PairingFailure = () => <BluetoothScanning isError />;

class RenderError extends Component<Props> {
  render() {
    const { error, status, onBypassGenuine, onRetry } = this.props;

    // $FlowFixMe
    if (error.errorCode === BleErrorCode.LocationServicesDisabled) {
      return <LocationRequired onRetry={onRetry} errorType="disabled" />;
    }

    // $FlowFixMe
    if (error.errorCode === BleErrorCode.BluetoothUnauthorized) {
      return <LocationRequired onRetry={onRetry} errorType="unauthorized" />;
    }

    const primaryError =
      status === "pairing"
        ? new PairingFailed()
        : status === "genuinecheck"
          ? new GenuineCheckFailed()
          : error;

    const Header = status === "pairing" ? PairingFailure : GenericErrorHeader;

    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <Header />
          <LText semiBold style={styles.title}>
            <TranslatedError error={primaryError} />
          </LText>
          <LText style={styles.description}>
            <TranslatedError error={primaryError} field="description" />
          </LText>
          <View style={styles.buttonContainer}>
            {status === "genuinecheck" ? (
              <Button
                type="secondary"
                title={<Trans i18nKey="PairDevices.bypassGenuine" />}
                onPress={onBypassGenuine}
                containerStyle={[styles.button, styles.secondaryButton]}
              />
            ) : null}
            <Button
              type="primary"
              title={<Trans i18nKey="common.retry" />}
              onPress={onRetry}
              containerStyle={styles.button}
            />
          </View>
          <TouchableOpacity
            style={styles.helpContainer}
            hitSlop={hitSlop}
            onPress={() => Linking.openURL(urls.faq)}
          >
            <Help size={16} color={colors.live} />
            <LText style={styles.helpText} semiBold>
              <Trans i18nKey="common.needHelp" />
            </LText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

export default RenderError;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  title: {
    marginTop: 32,
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 18,
  },
  description: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: colors.grey,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 32,
  },
  button: {
    flex: 1,
  },
  helpContainer: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  helpText: {
    color: colors.live,
    marginLeft: 6,
  },
  secondaryButton: {
    marginRight: 10,
  },
});
