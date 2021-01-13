// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import { BleErrorCode } from "react-native-ble-plx";
import { Trans } from "react-i18next";
import { PairingFailed, GenuineCheckFailed } from "@ledgerhq/errors";
import { useTheme } from "@react-navigation/native";
import LocationRequired from "../LocationRequired";
import { TrackScreen } from "../../analytics";
import Touchable from "../../components/Touchable";
import LText from "../../components/LText";
import Button from "../../components/Button";
import GenericErrorView from "../../components/GenericErrorView";
import HelpLink from "../../components/HelpLink";
import IconArrowRight from "../../icons/ArrowRight";
import { urls } from "../../config/urls";

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

function RenderError({ error, status, onBypassGenuine, onRetry }: Props) {
  const { colors } = useTheme();

  // $FlowFixMe
  if (error.errorCode === BleErrorCode.LocationServicesDisabled) {
    return <LocationRequired onRetry={onRetry} errorType="disabled" />;
  }

  // $FlowFixMe
  if (error.errorCode === BleErrorCode.BluetoothUnauthorized) {
    return <LocationRequired onRetry={onRetry} errorType="unauthorized" />;
  }

  const isPairingStatus = status === "pairing";
  const isGenuineCheckStatus = status === "genuinecheck";
  const url = (isPairingStatus && urls.errors.PairingFailed) || undefined;

  const outerError = isPairingStatus
    ? new PairingFailed()
    : isGenuineCheckStatus
    ? new GenuineCheckFailed()
    : null;

  return (
    <View style={styles.root}>
      <TrackScreen category="PairDevices" name="Error" />
      <View style={styles.body}>
        <GenericErrorView
          error={error}
          outerError={outerError}
          withDescription
          withIcon
        />
        <View style={styles.buttonContainer}>
          <Button
            event="PairDevicesRetry"
            type="primary"
            title={<Trans i18nKey="common.retry" />}
            onPress={onRetry}
            containerStyle={styles.button}
          />
        </View>
        {isGenuineCheckStatus ? (
          <Touchable
            event="PairDevicesBypassGenuine"
            onPress={onBypassGenuine}
            hitSlop={hitSlop}
            style={styles.linkContainer}
          >
            <LText style={styles.linkText} color="live" semiBold>
              <Trans i18nKey="common.skip" />{" "}
            </LText>
            <IconArrowRight size={16} color={colors.live} />
          </Touchable>
        ) : (
          <HelpLink url={url} style={styles.linkContainer} />
        )}
      </View>
      {isGenuineCheckStatus ? (
        <View style={[styles.footer, { borderColor: colors.lightFog }]}>
          <HelpLink style={styles.linkContainerGenuine} />
        </View>
      ) : null}
    </View>
  );
}

export default RenderError;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  title: {
    marginTop: 32,
    textAlign: "center",

    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 32,
  },
  button: {
    flex: 1,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  linkContainerGenuine: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  linkText: {
    marginLeft: 6,
  },
  footer: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
  },
});
