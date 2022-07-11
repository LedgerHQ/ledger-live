import React, { useState } from "react";
import { Button, Flex, Icons } from "@ledgerhq/react-ui";
import Text from "~/renderer/components/Text";
import DeviceLanguageInstallation from "./DeviceLanguageInstallation";
import { DeviceInfo } from "@ledgerhq/live-common/types/manager";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

type Props = {
  deviceInfo: DeviceInfo,
  device: Device
}

const DeviceLanguage: React.FC<Props> = ({ deviceInfo, device }: Props) => {
  const [isLanguageInstallationOpen, setIsLanguageInstallation] = useState(false);

  return (
    <Flex>
      <Icons.LanguageMedium color="neutral.c80" size={24} />
      <Flex ml={1}>
        <Text ff="Inter|SemiBold" color="palette.text.shade40" fontSize={4}>
          Language
        </Text>
      </Flex>
      <Button Icon={Icons.ChevronRightMedium} onClick={() => setIsLanguageInstallation(true)}>English</Button>
      <DeviceLanguageInstallation
        isOpen={isLanguageInstallationOpen}
        onClose={() => setIsLanguageInstallation(false)}
        deviceInfo={deviceInfo}
        device={device}
      />
    </Flex>
  );
};

export default DeviceLanguage;
