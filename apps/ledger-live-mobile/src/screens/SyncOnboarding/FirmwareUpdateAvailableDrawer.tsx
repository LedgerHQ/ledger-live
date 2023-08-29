import React from "react";
import { BoxedIcon, Button, Flex, Icons, IconsLegacy, Link, Text } from "@ledgerhq/native-ui";
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
      <Flex justifyContent="center" alignItems="center" mb={7}>
        <BoxedIcon
          Icon={<Icons.InformationFill color="primary.c80" size={"L"} />}
          variant="circle"
          backgroundColor="opacityDefault.c05"
          borderColor="transparent"
          size={72}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold">
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.title", { productName })}
      </Text>
      <Text mt={6} textAlign="center" variant="bodyLineHeight" color="neutral.c80">
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.descriptionVersion", {
          firmwareVersion,
        })}
        {"\n"}
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.description", { productName })}
      </Text>
      <Button mt={8} mb={7} type="main" onPress={onUpdate} size={"large"}>
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.updateCta")}
      </Button>
      <Link onPress={onUpdate} size={"large"} Icon={IconsLegacy.ExternalLinkMedium}>
        {t("earlySecurityCheck.firmwareUpdateAvailableDrawer.seeWhatsInUpdateCta")}
      </Link>
      <Flex height={7} />
    </QueuedDrawer>
  );
};

export default FirmwareUpdateAvailableDrawer;
