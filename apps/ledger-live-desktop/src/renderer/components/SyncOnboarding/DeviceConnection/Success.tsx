import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { useHistory } from "react-router-dom";
import OnboardingNavHeader from "../../Onboarding/OnboardingNavHeader";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import Animation from "~/renderer/animations";
import useTheme from "~/renderer/hooks/useTheme";

export type SyncOnboardingDeviceConnectionSuccessProps = {
  device: Device;
};

const SyncOnboardingDeviceConnectionSuccess = ({
  device,
}: SyncOnboardingDeviceConnectionSuccessProps) => {
  const { t } = useTranslation();
  const history = useHistory();

  const deviceName = device.deviceName ?? getDeviceModel(device.modelId).productName;
  const theme = useTheme();

  return (
    <Flex height="100%" width="100%" flexDirection="column">
      <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
      <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column">
        <Animation
          animation={getDeviceAnimation(device.modelId, theme.theme, "connectionSuccess") as object}
          width={"200px"}
        />
        <Text variant="h3Inter" color="neutral.c100" mt={6} maxWidth={480}>
          {t("syncOnboarding.connection.success.title", { deviceName })}
        </Text>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingDeviceConnectionSuccess;
