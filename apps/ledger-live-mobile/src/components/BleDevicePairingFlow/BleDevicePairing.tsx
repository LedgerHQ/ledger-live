import React, { ReactNode, useCallback, useEffect } from "react";
import { Linking } from "react-native";
import { useTheme } from "styled-components/native";
import { useBleDevicePairing } from "@ledgerhq/live-common/ble/hooks/useBleDevicePairing";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Trans, useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { Flex, InfiniteLoader, Text, Button, Icons, BoxedIcon } from "@ledgerhq/native-ui";

import { LockedDeviceError, PeerRemovedPairing } from "@ledgerhq/errors";
import { getDeviceAnimation } from "../../helpers/getDeviceAnimation";
import Animation from "../Animation";
import { TrackScreen } from "../../analytics";
import GenericErrorView from "../GenericErrorView";
import { urls } from "../../config/urls";

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

  const productName = getDeviceModel(deviceToPair.modelId).productName || deviceToPair.modelId;
  const deviceName = deviceToPair.deviceName || productName;

  const { isPaired, pairingError } = useBleDevicePairing({
    deviceId: deviceToPair.deviceId,
  });

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
        <Flex width="100%" py={16} alignItems="center">
          <Flex height={100} justifyContent="center">
            <BoxedIcon
              Icon={Icons.CheckTickMedium}
              backgroundColor={colors.opacityDefault.c05}
              size={64}
              variant="circle"
              borderColor="none"
              iconSize={32}
              iconColor={colors.success.c50}
            />
          </Flex>
          <Text mb={4} mt={16} textAlign="center" variant="h4" fontWeight="semiBold">
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
            withIcon
            withHelp={false}
          />
        </Flex>

        <Flex mt={30} flexDirection="column" style={{ width: "100%" }}>
          <Button type="main" onPress={onRetry} mt={6}>
            <Trans i18nKey="common.retry" />
          </Button>
          <Button iconPosition="right" Icon={Icons.ExternalLinkMedium} onPress={onOpenHelp} mb={0}>
            <Trans i18nKey="help.helpCenter.desc" />
          </Button>
        </Flex>
      </Flex>
    );
  } else if (pairingError) {
    // TODO refactor this into the generic error rendering when possible.
    let title;
    let subtitle;

    if ((pairingError as unknown) instanceof LockedDeviceError) {
      title = t("blePairingFlow.pairing.error.lockedDevice.title");
      subtitle = t("blePairingFlow.pairing.error.lockedDevice.subtitle", {
        productName,
      });
    } else {
      title = t("blePairingFlow.pairing.error.generic.title");
      subtitle = t("blePairingFlow.pairing.error.generic.subtitle", {
        productName,
      });
    }

    content = (
      <Flex flex={1}>
        <TrackScreen category="BT failed to pair" />
        <Flex flex={1} alignItems="center" justifyContent="center">
          <Flex height={100} justifyContent="center">
            <BoxedIcon
              Icon={Icons.CloseMedium}
              backgroundColor={colors.opacityDefault.c05}
              size={64}
              variant="circle"
              borderColor="none"
              iconSize={32}
              iconColor={colors.error.c60}
            />
          </Flex>
          <Text mt={4} mb={2} textAlign="center" variant="h4" fontWeight="semiBold">
            {title}
          </Text>
          <Text variant="body" mb={8} color="neutral.c80" textAlign="center">
            {subtitle}
          </Text>
        </Flex>
        <Button type="main" onPress={onRetry} mb={8}>
          {t("blePairingFlow.pairing.error.retryCta")}
        </Button>
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
              borderColor="none"
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
    </Flex>
  );
};

export default BleDevicePairing;
