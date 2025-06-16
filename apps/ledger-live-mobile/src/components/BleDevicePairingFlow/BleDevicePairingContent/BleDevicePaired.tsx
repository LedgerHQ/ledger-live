import { TrackScreen } from "~/analytics";
import { BoxedIcon, Flex, Icons, Text } from "@ledgerhq/native-ui";
import Animation from "~/components/Animation";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import React from "react";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export const BleDevicePaired = ({
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
            deviceName: device.deviceName,
          })}
        </Text>
        {/* Transparent text in order to have a smooth transition between loading and success */}
        <Text variant="body" textAlign="center" color="transparent">
          {t("blePairingFlow.pairing.loading.subtitle", { productName })}
        </Text>
      </Flex>
      <Animation
        style={{ height: 200 }}
        source={getDeviceAnimation({
          modelId: device.modelId,
          key: "blePaired",
          theme,
        })}
      />
    </Flex>
  );
};
