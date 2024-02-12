import React from "react";
import { Icons, Button, Flex, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import { GenericInformationBody } from "~/components/GenericInformationBody";

export type Props = {
  /**
   * State to trigger the opening/closing of the drawer
   */
  isOpen: boolean;

  /**
   * Callback when the user wants to resume the genuine check and presses on the resume button
   */
  onResume?: () => void;

  /**
   * Callback when the user wants to cancel the genuine check (and fw check) steps and presses on the cancel button
   */
  onCancel?: () => void;

  /**
   * Callback when the drawer is closed
   *
   * As the drawer has no close button (`noCloseButton`), the drawer is closed only when `isOpen === false`
   */
  onClose?: () => void;

  /**
   * Product name to be displayed in message
   */
  productName: string;
};

/**
 * Drawer displayed when the user presses on the close button during the early security check
 */
const EarlySecurityCheckMandatoryDrawer: React.FC<Props> = ({
  isOpen,
  onResume,
  onCancel,
  onClose,
  productName,
}) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen
        category="User tries to skip early security check"
        type="drawer"
        refreshSource={false}
      />
      <Flex flexDirection="column" alignItems={"center"} mt={10}>
        <GenericInformationBody
          title={t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.title")}
          description={t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.description", {
            productName,
          })}
          Icon={Icons.WarningFill}
          iconColor="warning.c70"
        />
      </Flex>
      <Button mt={8} mb={7} type="main" onPress={onResume} size={"large"}>
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.resumeCta")}
      </Button>
      <Link onPress={onCancel} size={"large"}>
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.cancelCta")}
      </Link>
    </QueuedDrawer>
  );
};

export default EarlySecurityCheckMandatoryDrawer;
