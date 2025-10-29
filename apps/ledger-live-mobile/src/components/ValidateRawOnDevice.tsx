import React from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";
import styled, { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import Alert from "./Alert";
import Animation from "./Animation";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { TitleText } from "./DeviceAction/rendering";

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "150px",
  mb: 10,
})``;

type Props = {
  device: Device;
  transaction: string;
  account: AccountLike;
  parentAccount: Account | null | undefined;
};

export default function ValidateOnDevice({ device }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const deviceModel = getDeviceModel(device.modelId);
  const recipientWording = t("ValidateOnDevice.recipientWording.send");
  const titleWording = t("ValidateOnDevice.title.send", { ...deviceModel });

  return (
    <Flex flex={1}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
        }}
        testID="device-validation-scroll-view"
      >
        <Flex alignItems="center">
          <AnimationContainer>
            <Animation
              source={getDeviceAnimation({ modelId: device.modelId, key: "sign", theme })}
              style={getDeviceAnimationStyles(device.modelId)}
            />
          </AnimationContainer>
          <TitleText>{titleWording}</TitleText>
        </Flex>
      </ScrollView>
      <Flex>
        <Alert type="help">{recipientWording}</Alert>
      </Flex>
    </Flex>
  );
}
