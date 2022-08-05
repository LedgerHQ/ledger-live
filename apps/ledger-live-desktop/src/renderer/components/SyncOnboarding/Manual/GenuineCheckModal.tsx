import React from "react";
import { Button, Flex, Popin, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const GenuineCheckModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <Popin position="relative" isOpen={isOpen}>
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        height="100%"
        padding="40px"
      >
        <Text variant="h2" fontSize="20px" color="palette.primary.c80">
          {t("syncOnboarding.manual.genuineCheckPopin.title")}
        </Text>
        <Text variant="paragraph" fontSize="25px" textAlign="center">
          {t("syncOnboarding.manual.genuineCheckPopin.paragraph1")}
        </Text>
        <Text variant="paragraph" fontSize="18px" color="palette.neutral.c80" textAlign="center">
          {t("syncOnboarding.manual.genuineCheckPopin.paragraph2")}
        </Text>
        <Button variant="main" width="100%" onClick={onClose}>
          {t("syncOnboarding.manual.genuineCheckPopin.checkDeviceButton")}
        </Button>
      </Flex>
    </Popin>
  );
};

export default GenuineCheckModal;
