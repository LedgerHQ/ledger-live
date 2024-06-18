import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";

import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import Animation from "~/renderer/animations";
import styled, { useTheme } from "styled-components";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { useTranslation } from "react-i18next";

type Props = {
  modelId: DeviceModelId;
  isDeviceBlocker?: boolean;
};

const getProductName = (modelId: DeviceModelId) =>
  getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

export default function FollowStepsOnDevice({ modelId, isDeviceBlocker }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const wording = getProductName(modelId);
  return (
    <>
      {isDeviceBlocker ? <DeviceBlocker /> : null}
      <AnimationWrapper>
        <Animation animation={getDeviceAnimation(modelId, theme, "openApp")} />
      </AnimationWrapper>
      <Footer>
        <Title fontWeight="semiBold" color="neutral.c100" textAlign="center" fontSize="20px">
          {t("walletSync.deviceAction.title", { wording })}
        </Title>
        <SubTitle variant="bodyLineHeight" color="neutral.c70" textAlign="center" fontSize="14px">
          {t("walletSync.deviceAction.description")}
        </SubTitle>
      </Footer>
    </>
  );
}

export const AnimationWrapper = styled.div`
  width: 600px;
  max-width: 100%;
  padding-bottom: 20px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Footer = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-content: center;
  align-items: center;
  row-gap: 16px;
`;

export const Title = styled(Text)``;

export const SubTitle = styled(Text)``;
