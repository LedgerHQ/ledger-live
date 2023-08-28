import React from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { NanoFirmwareUpdateMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";

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
        <BoxedIcon
          Icon={<NanoFirmwareUpdateMedium color="primary.c90" size={24} />}
          variant="circle"
          backgroundColor="primary.c30"
          borderColor="transparent"
          size={48}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.title")}
      </Text>
      <Text textAlign="center" variant="bodyLineHeight" mb={1} color="neutral.c80">
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.descriptionVersion", {
          firmwareVersion,
        })}
      </Text>
      <Text textAlign="center" variant="bodyLineHeight" mb={8} color="neutral.c80">
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.description", { productName })}
      </Text>
      <Button type="main" mb={6} onPress={onUpdate}>
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.updateCta")}
      </Button>
    </QueuedDrawer>
  );
};

export default FirmwareUpdateAvailableDrawer;
