import React, { useCallback, useContext } from "react";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useHistory } from "react-router-dom";

import DeviceIllustration from "../../DeviceIllustration";
import OnboardingNavHeader from "../../Onboarding/OnboardingNavHeader";
import { OnboardingContext } from "../../Onboarding";

export type SyncOnboardingDeviceConnectionSearchingProps = {
  deviceModelId: DeviceModelId;
};

const SyncOnboardingDeviceConnectionSearching = ({
  deviceModelId,
}: SyncOnboardingDeviceConnectionSearchingProps) => {
  const { t } = useTranslation();
  const deviceModelName = getDeviceModel(deviceModelId).productName;
  const history = useHistory();
  const { setDeviceModelId } = useContext(OnboardingContext);

  const handleConnectionTrouble = useCallback(() => {
    setDeviceModelId(deviceModelId);
    history.push("/onboarding/select-use-case");
  }, [deviceModelId, history, setDeviceModelId]);

  return (
    <Flex position="relative" height="100%" width="100%" flexDirection="column">
      <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
      <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column">
        <DeviceIllustration deviceId={deviceModelId} />
        <Text variant="h3Inter" color="neutral.c100" mt={16}>
          {t("syncOnboarding.connection.searching.title", { deviceModelName })}
        </Text>
      </Flex>
      <Link
        position="absolute"
        ml="auto"
        mr="auto"
        left={0}
        right={0}
        bottom={12}
        onClick={handleConnectionTrouble}
        color="neutral.c60"
      >
        {t("syncOnboarding.connection.searching.connectionTrouble")}
      </Link>
    </Flex>
  );
};

export default SyncOnboardingDeviceConnectionSearching;
