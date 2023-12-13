import React from "react";
import { Button, Flex, Icons, IconsLegacy, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";
import { GenericInformationBody } from "~/components/GenericInformationBody";

export type Props = {
  isOpen: boolean;
  onUpdate: () => void;

  /**
   * Callback when the drawer is closed
   *
   * As the drawer has a close button, this callback can be called:
   * - when the drawer is closed with `isOpen === false`
   * - when the user presses the close button
   * So, in the current drawer system, `onClose` might be called twice:
   * when user presses the close button (then `isOpen` is set to false by parent), and then when `isOpen === false`
   */
  onClose: () => void;
  productName: string;
  firmwareVersion: string;
};

const FirmwareUpdateAvailableDrawer: React.FC<Props> = ({
  isOpen,
  onUpdate,
  onClose,
  productName,
  firmwareVersion,
}) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer onClose={onClose} isRequestingToBeOpened={isOpen} preventBackdropClick>
      <Flex justifyContent="center" alignItems="center">
        <GenericInformationBody
          Icon={Icons.InformationFill}
          iconColor="primary.c80"
          title={t("earlySecurityCheck.firmwareUpdateAvailableDrawer.title", { productName })}
          description={
            <>
              {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.descriptionVersion", {
                firmwareVersion,
              })}
              {"\n"}
              {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.description", { productName })}
            </>
          }
        />
      </Flex>
      <Button mt={8} mb={7} type="main" onPress={onUpdate} size={"large"}>
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.updateCta")}
      </Button>
      <Link onPress={onUpdate} size={"large"} Icon={IconsLegacy.ExternalLinkMedium}>
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.seeWhatsInUpdateCta")}
      </Link>
    </QueuedDrawer>
  );
};

export default FirmwareUpdateAvailableDrawer;
