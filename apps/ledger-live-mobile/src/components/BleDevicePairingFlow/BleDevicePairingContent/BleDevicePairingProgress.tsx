import { BoxedIcon, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import Config from "react-native-config";
import Animation from "~/components/Animation";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import React from "react";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/types-devices";

export const BleDevicePairingProgress = ({
  device,
  productName,
}: {
  device: Device;
  productName: string;
}) => {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Flex flex={1} alignItems="center">
      <TrackScreen category="BT pairing successful" />
      <Flex width="100%" py={16} alignItems="center">
        <Flex height={100} justifyContent="center">
          <BoxedIcon
            Icon={() => (
              <InfiniteLoader
                color="primary.c80"
                size={32}
                mock={Config.DETOX}
                testID="ble-pairing-loading"
              />
            )}
            backgroundColor={colors.opacityDefault.c05}
            size={64}
            variant="circle"
            borderColor={"transparent"}
            iconSize={32}
            iconColor={colors.success.c50}
          />
        </Flex>
        <Text mb={4} mt={16} textAlign="center" variant="h4" fontWeight="semiBold">
          {t("blePairingFlow.pairing.loading.title", { deviceName: device.deviceName })}
        </Text>
        <Text variant="body" textAlign="center">
          {t("blePairingFlow.pairing.loading.subtitle", { productName })}
        </Text>
      </Flex>
      <Animation
        style={{ height: 200 }}
        source={getDeviceAnimation({
          modelId: device.modelId,
          key: "blePairing",
          theme,
        })}
      />
    </Flex>
  );
};
