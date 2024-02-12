import React, { useCallback } from "react";
import { Button, Flex } from "@ledgerhq/native-ui";
import { ExternalLinkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen, track } from "~/analytics";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";
import { useLocale } from "~/context/Locale";
import { GenericInformationBody } from "~/components/GenericInformationBody";

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
      <Flex justifyContent="center" alignItems="center" mt={7}>
        <GenericInformationBody
          title={t("earlySecurityCheck.genuineCheckNonGenuineDrawer.title")}
          description={t("earlySecurityCheck.genuineCheckNonGenuineDrawer.description", {
            productName,
          })}
        />
      </Flex>
      <Flex mt={8} mb={7}>
        <Button
          type="main"
          size="large"
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
