import React, { useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Flex, Text } from "@ledgerhq/react-ui";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import OnboardingNavHeader from "../Onboarding/OnboardingNavHeader";
import { DeviceModelId } from "@ledgerhq/devices";
import { OnboardingContext, UseCase } from "../Onboarding";
import { ScreenId } from "../Onboarding/Screens/Tutorial";

const RecoverRestore = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const currentDevice = useSelector(getCurrentDevice);
  const { setDeviceModelId } = useContext(OnboardingContext);

  useEffect(() => {
    switch (currentDevice?.modelId) {
      case DeviceModelId.nanoX:
        setDeviceModelId(currentDevice.modelId);
        history.push(`/onboarding/${UseCase.recover}/${ScreenId.pairMyNano}`);
        break;
      case DeviceModelId.stax:
        history.push(`/onboarding/sync/${currentDevice.modelId}`);
        break;
      default:
        break;
    }
  }, [currentDevice?.modelId, history, setDeviceModelId]);

  return (
    <Flex width="100%" height="100%" position="relative">
      <Flex position="relative" height="100%" width="100%" flexDirection="column">
        <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
        <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column">
          <Text
            variant="h3Inter"
            color="neutral.c100"
            mt={16}
            data-test-id="recover-restore-connect-text"
          >
            {t("recoverRestore.title")}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(RecoverRestore);
