import React from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { InfoAltFillMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen } from "../../analytics";
import GenericErrorView from "../../components/GenericErrorView";

export type Props = {
  /**
   * State to trigger the opening/closing of the drawer
   */
  isOpen: boolean;

  /**
   * Callback when the user wants to retry the genuine check and presses on the retry button
   */
  onRetry?: () => void;

  /**
   * Callback when the user wants to skip the genuine check step and presses on the skip button
   */
  onSkip?: () => void;

  /**
   * Callback when the drawer is closed
   *
   * As the drawer has no close button (`noCloseButton`), the drawer is closed only when `isOpen === false`
   */
  onClose?: () => void;

  productName: string;

  /**
   * Error instance coming from the genuine check hook - if null, a default message is displayed.
   */
  error: Error | null;
};

/**
 * Drawer displayed on a failed genuine check during the early security check
 *
 * The failed genuine check can come from an error that happened during the genuine check
 * or if the user cancelled/did not allow the genuine check.
 *
 * If `error` is set, displays the associated `GenericErrorView` with the translated message defined in common.json
 *
 * Otherwise displays an error message informing the user that they cancelled the genuine check
 */
const GenuineCheckFailedDrawer: React.FC<Props> = ({
  isOpen,
  onRetry,
  onSkip,
  onClose,
  productName,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen category="Failed Stax hardware check" type="drawer" refreshSource={false} />
      {error ? (
        <>
          <Flex p={3}>
            <GenericErrorView error={error} />
          </Flex>
          <Button type="main" mt={4} mb={4} onPress={onRetry}>
            {t("common.retry")}
          </Button>
          <Button onPress={onSkip}>{t("common.skip")}</Button>
        </>
      ) : (
        <>
          <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
            <BoxedIcon
              Icon={<InfoAltFillMedium color="primary.c70" size={32} />}
              variant="circle"
              backgroundColor="neutral.c30"
              borderColor="transparent"
              size={64}
            />
          </Flex>
          <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
            {t("earlySecurityCheck.genuineCheckFailedDrawer.title")}
          </Text>
          <Text textAlign="center" variant="bodyLineHeight" mb={8} color="neutral.c80">
            {t("earlySecurityCheck.genuineCheckFailedDrawer.description", {
              productName,
            })}
          </Text>
          <Button type="main" mb={4} onPress={onRetry}>
            {t("earlySecurityCheck.genuineCheckFailedDrawer.retryCta")}
          </Button>
          <Button onPress={onSkip}>
            {t("earlySecurityCheck.genuineCheckFailedDrawer.skipCta")}
          </Button>
        </>
      )}
    </QueuedDrawer>
  );
};

export default GenuineCheckFailedDrawer;
