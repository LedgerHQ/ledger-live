import React from "react";
import { Button, Flex, Icons, Popin, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

const AppInstallPopin = styled(Popin)`
  max-height: unset !important;
  height: unset !important;
`;

type Props = {
  isOpen: boolean;
  productName: string;
  onClose: () => void;
};

const LockedModal = ({ isOpen, productName, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <AppInstallPopin isOpen={isOpen}>
      <Flex flex={1} justifyContent="center" alignItems="center">
        <Flex borderRadius={9999} p={6} bg="neutral.c20">
          <Icons.WarningSolidMedium size={32} color="warning.c70" />
        </Flex>
      </Flex>
      <Flex flex={1} flexDirection="column" justifyContent="center" alignItems="center" px={12}>
        <Text mb={8} variant="body" fontSize={24} textAlign="center">
          {t("onboardingAppInstall.locked.title", { productName })}
        </Text>
        <Text mb={14} fontSize={16} variant="body" color="palette.neutral.c80" textAlign="center">
          {t("onboardingAppInstall.locked.subtitle", { productName })}
        </Text>
        <Flex flexDirection="column" width="100%">
          <Button size="large" variant="main" width="100%" onClick={onClose} mb={8}>
            {t("onboardingAppInstall.locked.installCTA")}
          </Button>
        </Flex>
      </Flex>
    </AppInstallPopin>
  );
};

export default LockedModal;
