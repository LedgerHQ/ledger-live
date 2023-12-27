import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useTheme } from "styled-components/native";
import { useBleDevicePairing } from "@ledgerhq/live-common/ble/hooks/useBleDevicePairing";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Trans, useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  Flex,
  InfiniteLoader,
  Text,
  Button,
  IconsLegacy,
  BoxedIcon,
  Icons,
} from "@ledgerhq/native-ui";

import { LockedDeviceError, PeerRemovedPairing } from "@ledgerhq/errors";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import Animation from "../Animation";
import { TrackScreen } from "~/analytics";
import GenericErrorView from "../GenericErrorView";
import { GenericInformationBody } from "../GenericInformationBody";
import ExternalLink from "../ExternalLink";
import UnlockDeviceDrawer from "../UnlockDeviceDrawer";
import { urls } from "~/utils/urls";

export type BleDevicePairingProps = {
  onPaired: (device: Device) => void;
  onRetry: () => void;
  deviceToPair: Device;
};

/**
 * Runs a BLE pairing with the given device. Displays pairing, success or error steps.
 *
 * A closing cross is displayed to the user during the pairing, which either calls onPaired if
 * the device is already paired, or onRetry otherwise.
 *
 * @param deviceToPair Device to pair
 * @param onPaired Function called when pairing was successful
 * @param onRetry Function called when the user chooses to retry on unsuccessful pairing
 */
const BleDevicePairing = ({ deviceToPair, onPaired, onRetry }: BleDevicePairingProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = colors.type as "dark" | "light";
  const [deviceLocked, setDeviceLocked] = useState<Device | null>(null);

  const productName = getDeviceModel(deviceToPair.modelId).productName || deviceToPair.modelId;
  const deviceName = deviceToPair.deviceName || productName;

  const { isPaired, pairingError } = useBleDevicePairing({
    deviceId: deviceToPair.deviceId,
  });

  useEffect(() => {
    if (pairingError instanceof LockedDeviceError) {
      setDeviceLocked(deviceToPair);
      return;
    }

    setDeviceLocked(null);
  }, [deviceToPair, pairingError]);

  const onOpenHelp = useCallback(() => {
    Linking.openURL(urls.errors.PairingFailed);
  }, []);

  useEffect(() => {
    if (isPaired) {
      onPaired(deviceToPair);
    }
  }, [isPaired, deviceToPair, onPaired]);

  let content: ReactNode;

  if (isPaired) {
    content = (
      <Flex flex={1} alignItems="center">
        <TrackScreen category="BT pairing successful" />
        <Flex width="100%" py={6} alignItems="center">
          <Flex height={100} justifyContent="center" mb={7}>
            <BoxedIcon
              Icon={Icons.CheckmarkCircleFill}
              backgroundColor={colors.opacityDefault.c05}
              size={64}
              variant="circle"
              borderColor="transparent"
              iconSize={"L"}
              iconColor={colors.success.c50}
            />
          </Flex>
          <Text mb={6} mt={16} textAlign="center" variant="h4" fontWeight="semiBold">
            {t("blePairingFlow.pairing.success.title", {
              deviceName,
            })}
          </Text>
          {/* Transparent text in order to have a smooth transition between loading and success */}
          <Text variant="body" textAlign="center" color="transparent">
            {t("blePairingFlow.pairing.loading.subtitle", { productName })}
          </Text>
        </Flex>
        <Animation
          style={{ marginTop: -20 }}
          source={getDeviceAnimation({
            device: deviceToPair,
            key: "blePaired",
            theme,
          })}
        />
      </Flex>
    );
  } else if (pairingError instanceof PeerRemovedPairing) {
    content = (
      <Flex flex={1} justifyContent="space-between">
        <Flex flex={1} justifyContent="center">
          <GenericErrorView
            error={pairingError}
            withDescription
            hasExportLogButton={false}
            withHelp={false}
          />
        </Flex>

        <Flex mt={30} flexDirection="column" style={{ width: "100%" }}>
          <Button type="main" onPress={onRetry} mt={6}>
            <Trans i18nKey="common.retry" />
          </Button>
          <Button
            iconPosition="right"
            Icon={IconsLegacy.ExternalLinkMedium}
            onPress={onOpenHelp}
            mb={0}
          >
            <Trans i18nKey="help.helpCenter.desc" />
          </Button>
        </Flex>
      </Flex>
    );
  } else if (pairingError && !((pairingError as unknown) instanceof LockedDeviceError)) {
    // TODO refactor this into the generic error rendering when possible.
    content = (
      <Flex flex={1} mb={6}>
        <TrackScreen category="BT failed to pair" />
        <Flex flex={1} alignItems="center" justifyContent="center">
          <GenericInformationBody
            title={t("blePairingFlow.pairing.error.generic.title")}
            description={t("blePairingFlow.pairing.error.generic.subtitle", {
              productName,
            })}
          />
        </Flex>
        <Button type="main" size="large" onPress={onRetry} mb={7}>
          {t("blePairingFlow.pairing.error.retryCta")}
        </Button>
        <ExternalLink
          type="main"
          text={t("blePairingFlow.pairing.error.howToFixPairingIssue")}
          onPress={onOpenHelp}
        />
      </Flex>
    );
  } else {
    content = (
      <Flex flex={1} alignItems="center">
        <TrackScreen category="BT pairing successful" />
        <Flex width="100%" py={16} alignItems="center">
          <Flex height={100} justifyContent="center">
            <BoxedIcon
              Icon={<InfiniteLoader color="primary.c80" size={32} />}
              backgroundColor={colors.opacityDefault.c05}
              size={64}
              variant="circle"
              borderColor={"transparent"}
              iconSize={32}
              iconColor={colors.success.c50}
            />
          </Flex>
          <Text mb={4} mt={16} textAlign="center" variant="h4" fontWeight="semiBold">
            {t("blePairingFlow.pairing.loading.title", { deviceName })}
          </Text>
          <Text variant="body" textAlign="center">
            {t("blePairingFlow.pairing.loading.subtitle", { productName })}
          </Text>
        </Flex>
        <Animation
          style={{ marginTop: -20 }}
          source={getDeviceAnimation({
            device: deviceToPair,
            key: "blePairing",
            theme,
          })}
        />
      </Flex>
    );
  }

  return (
    <Flex flex={1} width="100%">
      {content}

      {deviceLocked ? (
        <UnlockDeviceDrawer isOpen={true} device={deviceLocked} onClose={onRetry} />
      ) : null}
    </Flex>
  );
};

export default BleDevicePairing;
