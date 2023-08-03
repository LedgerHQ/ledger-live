import React from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { WarningSolidMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen } from "../../analytics";

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
      <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
        <BoxedIcon
          Icon={<WarningSolidMedium color="warning.c60" size={32} />}
          variant="circle"
          backgroundColor="neutral.c30"
          borderColor="transparent"
          size={64}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.title")}
      </Text>
      <Text textAlign="center" variant="bodyLineHeight" mb={8} color="neutral.c80">
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.description", {
          productName,
        })}
      </Text>
      <Button type="main" mb={4} onPress={onResume}>
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.resumeCta")}
      </Button>
      <Button onPress={onCancel}>
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.cancelCta")}
      </Button>
    </QueuedDrawer>
  );
};

export default EarlySecurityCheckMandatoryDrawer;
