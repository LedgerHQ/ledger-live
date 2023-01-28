import React, { useEffect } from "react";

import { useTranslation } from "react-i18next";
import { Flex, Text, Button, Icons } from "@ledgerhq/native-ui";

const DeviceRenamed: React.FC<{
  onContinue?: () => void;
  onMount: () => void;
  deviceName: string;
}> = ({ onContinue, onMount, deviceName }) => {
  const { t } = useTranslation();

  useEffect(() => {
    onMount && onMount();
  }, [onMount]);

  return (
    <Flex alignItems="center">
      <Flex backgroundColor="neutral.c30" p={4} borderRadius="9999px">
        <Icons.CircledCheckSolidMedium color="success.c100" size={32} />
      </Flex>
      <Text variant="h4" textAlign="center" my={7} fontWeight="semiBold">
        {t("EditDeviceName.success", { deviceName })}
      </Text>
      <Button type="main" alignSelf="stretch" onPress={onContinue}>
        {t("common.continue")}
      </Button>
    </Flex>
  );
};

export default DeviceRenamed;
