import React from "react";
import { Drawer, Flex, Text, Button, Link } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { ExternalLinkMedium } from "@ledgerhq/react-ui/assets/icons";

export type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const HelpDrawer = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <Drawer big isOpen={isOpen} onClose={onClose}>
      <Flex position="relative" flexDirection="column" height="100%" px={6}>
        <Flex flexDirection="column" flex={1}>
          <Text variant="h4Inter" fontSize={24} fontWeight="semiBold">
            {t("syncOnboarding.manual.helpDrawer.title")}
          </Text>
          <Text variant="body" mt={8}>
            {t("syncOnboarding.manual.helpDrawer.description")}
          </Text>
        </Flex>
        <Flex flexDirection="column">
          <Button variant="main" Icon={ExternalLinkMedium} iconSize={18}>
            {t("syncOnboarding.manual.helpDrawer.docButton")}
          </Button>
          <Link Icon={ExternalLinkMedium} mt={8}>
            {t("syncOnboarding.manual.helpDrawer.supportButton")}
          </Link>
        </Flex>
      </Flex>
    </Drawer>
  );
};

export default HelpDrawer;
