import React from "react";
import { StyleSheet } from "react-native";
import { BleErrorCode } from "react-native-ble-plx";
import { Trans } from "react-i18next";
import { PairingFailed, GenuineCheckFailed } from "@ledgerhq/errors";
import { Flex } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import LocationRequired from "../LocationRequired";
import { TrackScreen } from "../../analytics";
import Touchable from "../../components/Touchable";
import LText from "../../components/LText";
import GenericErrorView from "../../components/GenericErrorView";
import HelpLink from "../../components/HelpLink";
import IconArrowRight from "../../icons/ArrowRight";
import { urls } from "../../config/urls";
import Button from "../../components/Button";

type Props = {
  error: Error & { errorCode?: BleErrorCode };
  status: string;
  onRetry: () => void;
  onBypassGenuine: () => void;
};

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

function RenderError({ error, status, onBypassGenuine, onRetry }: Props) {
  const { colors } = useTheme();

  if (error.errorCode === BleErrorCode.LocationServicesDisabled) {
    return <LocationRequired onRetry={onRetry} errorType="disabled" />;
  }

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
    <Flex flex={1}>
      <TrackScreen category="PairDevices" name="Error" />
      <Flex flex={1} p={20} justifyContent="center">
        <GenericErrorView
          error={error}
          outerError={outerError}
          withDescription
          withIcon
        />
        <Flex mt={30} flexDirection={"row"}>
          <Button
            flex={1}
            event="PairDevicesRetry"
            type="main"
            onPress={onRetry}
          >
            <Trans i18nKey="common.retry" />
          </Button>
        </Flex>
        {isGenuineCheckStatus ? (
          <Touchable
            event="PairDevicesBypassGenuine"
            onPress={onBypassGenuine}
            hitSlop={hitSlop}
            style={styles.linkContainer}
          >
            <LText color={colors.primary} semiBold>
              <Trans i18nKey="common.skip" />{" "}
            </LText>
            <IconArrowRight size={16} color={colors.primary} />
          </Touchable>
        ) : (
          <HelpLink url={url} style={styles.linkContainer} />
        )}
      </Flex>
      {isGenuineCheckStatus ? (
        <Flex height={48}>
          <HelpLink style={styles.linkContainerGenuine} />
        </Flex>
      ) : null}
    </Flex>
  );
}

export default RenderError;

const styles = StyleSheet.create({
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
});
