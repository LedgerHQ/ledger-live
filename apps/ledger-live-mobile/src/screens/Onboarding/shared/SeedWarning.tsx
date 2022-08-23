import React, { useState, useCallback } from "react";

import { Linking, Image } from "react-native";
import { Trans } from "react-i18next";
import { getDeviceModel, DeviceModelId } from "@ledgerhq/devices";
import {
  Text,
  BottomDrawer,
  Button,
  Alert,
  Flex,
  IconBox,
  Icons,
} from "@ledgerhq/native-ui";
import { urls } from "../../../config/urls";

const SeedWarning = ({ deviceModelId }: { deviceModelId: DeviceModelId }) => {
  const deviceName = getDeviceModel(deviceModelId).productName;
  const [isOpened, setIsOpened] = useState(true);

  const onContactSupport = useCallback(() => {
    Linking.openURL(urls.contact);
  }, []);

  return (
    <BottomDrawer isOpen={isOpened} onClose={() => setIsOpened(false)}>
      <Flex alignItems="center">
        <IconBox
          Icon={Icons.WarningMedium}
          color="warning.c100"
          iconSize={24}
          boxSize={64}
        />
      </Flex>

      <Text variant="h2" mt={8} textAlign="center">
        <Trans i18nKey="onboarding.warning.seed.title" />
      </Text>
      <Text variant="body" mb={8} textAlign="center">
        <Trans i18nKey="onboarding.warning.seed.desc" values={{ deviceName }} />
      </Text>
      <Alert
        type="info"
        title={<Trans i18nKey="onboarding.warning.seed.warning" />}
      />
      <Button
        type="main"
        testID={"Onboarding - Seed warning"}
        onPress={() => setIsOpened(false)}
        mt={8}
        mb={6}
      >
        <Trans i18nKey="onboarding.warning.seed.continueCTA" />
      </Button>
      <Button type="default" outline={false} onPress={onContactSupport}>
        <Trans i18nKey="onboarding.warning.seed.contactSupportCTA" />
      </Button>
    </BottomDrawer>
  );
};

export default SeedWarning;
