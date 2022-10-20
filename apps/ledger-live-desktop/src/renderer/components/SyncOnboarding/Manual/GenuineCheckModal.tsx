import React from "react";
import { Button, Flex, Popin, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
};

const GenuineCheckModal = ({ isOpen, onClose, productName }: Props) => {
  const { t } = useTranslation();

  return (
    <Popin height="450px" isOpen={isOpen}>
      <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center" px={12}>
        <Text
          mb={14}
          variant="body"
          textTransform="uppercase"
          fontWeight="semiBold"
          fontSize={16}
          color="palette.primary.c80"
        >
          {t("syncOnboarding.manual.genuineCheckModal.title")}
        </Text>
        <Text mb={8} variant="body" fontSize={24} textAlign="center">
          {t("syncOnboarding.manual.genuineCheckModal.paragraph1", {
            deviceName: productName,
          })}
        </Text>
        <Text mb={14} variant="body" fontSize={16} color="palette.neutral.c80" textAlign="center">
          {t("syncOnboarding.manual.genuineCheckModal.paragraph2", {
            deviceName: productName,
          })}
        </Text>
        <Button size="large" variant="main" width="100%" onClick={onClose}>
          {t("syncOnboarding.manual.genuineCheckModal.checkDeviceButton")}
        </Button>
      </Flex>
    </Popin>
  );
};

export default GenuineCheckModal;
