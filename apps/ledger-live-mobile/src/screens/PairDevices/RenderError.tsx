import React, { useCallback } from "react";
import { Linking, StyleSheet } from "react-native";
import { BleError, BleError as DeprecatedError, BleErrorCode } from "react-native-ble-plx";
import { Trans } from "react-i18next";
import {
  PairingFailed,
  GenuineCheckFailed,
  HwTransportError,
  HwTransportErrorType,
  PeerRemovedPairing,
  FirmwareNotRecognized,
} from "@ledgerhq/errors";
import { Flex, Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "~/analytics";
import Touchable from "~/components/Touchable";
import LText from "~/components/LText";
import GenericErrorView from "~/components/GenericErrorView";
import HelpLink from "~/components/HelpLink";
import IconArrowRight from "~/icons/ArrowRight";
import { urls } from "~/utils/urls";
import LocationDisabled from "~/components/RequiresLocation/LocationDisabled";
import LocationPermissionDenied from "~/components/RequiresLocation/LocationPermissionDenied";
import { trace } from "@ledgerhq/logs";

type Props = {
  error: HwTransportError | DeprecatedError | Error;
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
  const isPairingStatus = status === "pairing";
  const isFirmwareNotRecognized = error instanceof FirmwareNotRecognized;
  const isGenuineCheckStatus = status === "genuinecheck";
  const isGenuineCheckSkippableError = isGenuineCheckStatus && !isFirmwareNotRecognized;
  const isBrokenPairing = error instanceof PeerRemovedPairing;

  const url = isBrokenPairing
    ? urls.errors.PeerRemovedPairing
    : isPairingStatus
    ? urls.errors.PairingFailed
    : undefined;

  const onOpenHelp = useCallback(() => {
    if (!url) return;
    Linking.openURL(url);
  }, [url]);

  // Location service is disabled
  if (
    (error instanceof BleError && error.errorCode === BleErrorCode.LocationServicesDisabled) ||
    (error instanceof HwTransportError &&
      error.type === HwTransportErrorType.LocationServicesDisabled)
  ) {
    return <LocationDisabled />;
  }

  // Location has not enough permissions
  // Indeed BleErrorCode.BluetoothUnauthorized is not the right error code. Legacy code.
  if (
    (error instanceof BleError && error.errorCode === BleErrorCode.BluetoothUnauthorized) ||
    (error instanceof HwTransportError &&
      error.type === HwTransportErrorType.LocationServicesUnauthorized)
  ) {
    return <LocationPermissionDenied />;
  }

  const outerError =
    isPairingStatus && !isBrokenPairing
      ? new PairingFailed()
      : isGenuineCheckSkippableError
      ? new GenuineCheckFailed()
      : null;

  trace({
    type: "hw",
    message: `Rendering error: ${error}`,
    data: {
      error,
      outerError,
      isPairingStatus,
      isBrokenPairing,
      isGenuineCheckSkippableError,
      isGenuineCheckStatus,
      isFirmwareNotRecognized,
    },
    context: { component: "PairDevices/RenderError" },
  });

  return (
    <Flex flex={1}>
      <TrackScreen category="PairDevices" name="Error" />
      <Flex flex={1} p={20} justifyContent="center">
        <GenericErrorView
          error={error}
          outerError={outerError}
          withDescription
          withHelp={!isBrokenPairing}
          hasExportLogButton={!isBrokenPairing}
        />
        {isBrokenPairing ? (
          <Flex mt={30} flexDirection="column">
            <Button
              type="main"
              iconPosition="right"
              Icon={IconsLegacy.ExternalLinkMedium}
              onPress={onOpenHelp}
              mb={0}
            >
              <Trans i18nKey="help.helpCenter.desc" />
            </Button>
            <Button onPress={onRetry} mt={6}>
              <Trans i18nKey="common.retry" />
            </Button>
          </Flex>
        ) : (
          <>
            <Flex mt={30} flexDirection={"row"}>
              <Button flex={1} iconPosition="left" type="main" onPress={onRetry}>
                <Trans i18nKey="common.retry" />
              </Button>
            </Flex>

            {isGenuineCheckSkippableError ? (
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
          </>
        )}
      </Flex>
      {isGenuineCheckSkippableError ? (
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
