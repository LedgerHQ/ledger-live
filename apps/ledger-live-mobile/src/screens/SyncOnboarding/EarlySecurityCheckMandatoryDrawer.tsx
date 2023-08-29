import React from "react";
import { Icons, BoxedIcon, Button, Flex, Text, Link } from "@ledgerhq/native-ui";
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
      <Flex justifyContent="center" alignItems="center" mt={10} mb={7}>
        <BoxedIcon
          Icon={<Icons.WarningFill color="warning.c70" size="L" />}
          variant="circle"
          backgroundColor="opacityDefault.c05"
          borderColor="transparent"
          size={72}
        />
      </Flex>
      <Text textAlign="center" variant="h4" fontWeight="semiBold">
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.title")}
      </Text>
      <Text mt={6} textAlign="center" variant="bodyLineHeight" color="neutral.c80">
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.description", {
          productName,
        })}
      </Text>
      <Button mt={8} mb={7} type="main" onPress={onResume} size={"large"}>
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.resumeCta")}
      </Button>
      <Link onPress={onCancel} size={"large"}>
        {t("earlySecurityCheck.earlySecurityCheckMandatoryDrawer.cancelCta")}
      </Link>
      <Flex height={7} />
    </QueuedDrawer>
  );
};

export default EarlySecurityCheckMandatoryDrawer;
