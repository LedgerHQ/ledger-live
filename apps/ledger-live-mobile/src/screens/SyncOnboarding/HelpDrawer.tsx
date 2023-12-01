import React, { useCallback } from "react";
import { Button, Link, Text } from "@ledgerhq/native-ui";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";

export type Props = {
  isOpen: boolean;
  onClose?: () => void;
};

const HelpDrawer = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation();

  const handleDocumentationPress = useCallback(() => {
    // TODO: add logic when user press "FAQ" button
  }, []);

  const handleSupportPress = useCallback(() => {
    // TODO: add logic when user press "Support" button
  }, []);

  return (
    <QueuedDrawer onClose={onClose} isRequestingToBeOpened={isOpen}>
      <Text variant="h4" fontWeight="semiBold" mb={4}>
        {t("syncOnboarding.helpDrawer.title")}
      </Text>
      <Text variant="bodyLineHeight" mb={8} color="neutral.c80">
        {t("syncOnboarding.helpDrawer.description")}
      </Text>
      <Button type="main" mb={6} onPress={handleDocumentationPress}>
        {t("syncOnboarding.helpDrawer.docCta")}
      </Button>
      <Link Icon={ExternalLinkMedium} onPress={handleSupportPress}>
        {t("syncOnboarding.helpDrawer.supportCta")}
      </Link>
    </QueuedDrawer>
  );
};

export default HelpDrawer;
