import React, { useCallback } from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { CircledCrossSolidMedium, ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen, track } from "../../analytics";
import { Linking } from "react-native";
import { urls } from "../../config/urls";
import { useLocale } from "../../context/Locale";

export type Props = {
  /**
   * State to trigger the opening/closing of the drawer
   */
  isOpen: boolean;

  /**
   * Callback when the user wants to close the drawer and press on the close button
   */
  onClose: () => void;

  productName: string;
};

/**
 * Drawer displayed when the device was found as non genuine.
 */
const GenuineCheckNonGenuineDrawer: React.FC<Props> = ({ isOpen, onClose, productName }) => {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const onContactSupport = useCallback(() => {
    track("button_clicked", {
      button: "Contacting support about non genuine device",
    });

    const supportUrl =
      locale in urls.contactSupportWebview
        ? urls.contactSupportWebview[locale as keyof typeof urls.contactSupportWebview]
        : urls.contactSupportWebview.en;

    Linking.openURL(supportUrl);
  }, [locale]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} preventBackdropClick>
      <TrackScreen category="Device not genuine" type="drawer" refreshSource={false} />
      <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
        <BoxedIcon
          Icon={<CircledCrossSolidMedium color="error.c60" size={32} />}
          variant="circle"
          backgroundColor="neutral.c30"
          borderColor="transparent"
          size={64}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
        {t("earlySecurityCheck.genuineCheckNonGenuineDrawer.title")}
      </Text>
      <Text textAlign="center" variant="bodyLineHeight" mb={8} color="neutral.c80">
        {t("earlySecurityCheck.genuineCheckNonGenuineDrawer.description", {
          productName,
        })}
      </Text>

      <Flex ml={4} mb={4}>
        <Button
          type="main"
          mb={4}
          onPress={onContactSupport}
          Icon={ExternalLinkMedium}
          iconPosition="right"
        >
          {t("earlySecurityCheck.genuineCheckNonGenuineDrawer.supportCta")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
};

export default GenuineCheckNonGenuineDrawer;
