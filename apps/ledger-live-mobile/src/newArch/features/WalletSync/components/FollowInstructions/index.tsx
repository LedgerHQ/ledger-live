import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import { getDeviceModel } from "@ledgerhq/devices";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";

import Animation from "~/components/Animation";
import { useSelector } from "react-redux";
import { lastSeenDeviceSelector } from "~/reducers/settings";

const getProductName = (modelId: DeviceModelId) =>
  getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

const animationStyles = (modelId: DeviceModelId) =>
  [DeviceModelId.stax, DeviceModelId.europa].includes(modelId) ? { height: 210 } : {};

const FollowInstructions: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const device = useSelector(lastSeenDeviceSelector);

  if (!device) return;
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={24} mb={2}>
      <TrackScreen />
      <AnimationContainer>
        <Animation
          source={getDeviceAnimation({
            device: device as Device,
            key: "openApp",
            theme,
          })}
          style={animationStyles(device.modelId)}
        />
      </AnimationContainer>
      <Flex justifyContent="center" alignItems="center" flexDirection="column" rowGap={16}>
        <Text fontWeight="semiBold" color="neutral.c100" textAlign="center" fontSize="20px">
          {t("walletSync.deviceAction.title", { wording: getProductName(DeviceModelId.stax) })}
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" fontSize="14px">
          {t("walletSync.deviceAction.description")}
        </Text>
      </Flex>
    </Flex>
  );
};

export default FollowInstructions;

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "150px",
})``;
