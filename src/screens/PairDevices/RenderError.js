// @flow

import React, { Component } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { BleErrorCode } from "react-native-ble-plx";
import Icon from "react-native-vector-icons/dist/Feather";
import { translate } from "react-i18next";
import LocationRequired from "../LocationRequired";
import LText from "../../components/LText";
import Button from "../../components/Button";
import TranslatedError from "../../components/TranslatedError";
import PairingFailure from "../../icons/PairingFailure";
import { PairingFailed, GenuineCheckFailed } from "../../errors";
import colors from "../../colors";

type Props = {
  error: Error,
  status: string,
  onCancel: () => void,
  onRetry: () => void,
  onBypassGenuine: () => void,
  t: *,
};

const GenericErrorHeader = () => (
  <LText>
    <Icon name="alert-triangle" size={32} color={colors.alert} />
  </LText>
);

class RenderError extends Component<Props> {
  render() {
    const { t, error, status, onCancel, onBypassGenuine, onRetry } = this.props;

    // $FlowFixMe
    if (error.errorCode === BleErrorCode.LocationServicesDisabled) {
      return <LocationRequired />;
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
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.contentContainer}
        >
          <Header />
          <View style={styles.container}>
            <LText semiBold style={styles.title}>
              <TranslatedError error={primaryError} />
            </LText>
            <LText style={styles.description}>
              <TranslatedError error={primaryError} field="description" />
            </LText>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {status === "genuinecheck" ? (
            <Button
              type="secondary"
              title={t("PairDevices.bypassGenuine")}
              onPress={onBypassGenuine}
              containerStyle={styles.button}
            />
          ) : (
            <Button
              type="secondary"
              title={t("common.cancel")}
              onPress={onCancel}
              containerStyle={styles.button}
            />
          )}
          <Button
            type="primary"
            title={t("common.retry")}
            onPress={onRetry}
            containerStyle={[styles.button, styles.primaryButton]}
          />
        </View>
      </View>
    );
  }
}

export default translate()(RenderError);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: "20%",
    flexDirection: "column",
    alignItems: "center",
  },
  container: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    color: colors.darkBlue,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
  },
  footer: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
  primaryButton: {
    marginLeft: 10,
  },
});
