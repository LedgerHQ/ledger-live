import React, { useCallback } from "react";
import { BoxedIcon, Button, Flex, Text } from "@ledgerhq/native-ui";
import { CircledCrossSolidMedium, WarningSolidMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "../../components/QueuedDrawer";
import { TrackScreen } from "../../analytics";
import GenericErrorView from "../../components/GenericErrorView";
import { FirmwareNotRecognized } from "@ledgerhq/errors";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../const";
import type { SyncOnboardingScreenProps } from ".";

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
   * Callback when the user wants to cancel the genuine check step and presses on the cancel button
   */
  onCancel?: () => void;

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
 * Drawer displayed when an error occurred during the genuine check during the early security check
 *
 * If `error` is set:
 * - special case when the wrong provider was set and the entity was not found
 * - otherwise displays the associated `GenericErrorView` with the translated message defined in common.json
 * Otherwise displays a generic error message
 */
const GenuineCheckErrorDrawer: React.FC<Props> = ({
  isOpen,
  onRetry,
  onCancel,
  onClose,
  productName,
  error,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<SyncOnboardingScreenProps["navigation"]>();

  // Depending from where the device was not recognized we can a FirmwareNotRecognized or a simple Error
  const isNotFoundEntity =
    error &&
    (error instanceof FirmwareNotRecognized || (error as Error).message === "not found entity");

  const onGoToSettings = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.ExperimentalSettings,
      },
    });
  }, [navigation]);

  let content;

  // Special case for the genuine check during the ESC
  if (isNotFoundEntity) {
    content = (
      <>
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
          {t("earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.title")}
        </Text>
        <Text textAlign="center" variant="bodyLineHeight" mb={8} color="neutral.c80">
          {t("earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.description", {
            productName,
          })}
        </Text>
        <Button type="main" mb={4} onPress={onGoToSettings}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.settingsCta")}
        </Button>
        <Button onPress={onCancel}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Button>
      </>
    );
  }
  // Generic error management
  else if (error) {
    content = (
      <>
        <GenericErrorView
          error={error}
          Icon={WarningSolidMedium}
          iconColor="warning.c70"
          hasExportLogButton={false}
          renderedInType="drawer"
        />
        <Button type="main" mt={4} onPress={onRetry}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.retryCta")}
        </Button>
        <Button onPress={onCancel}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Button>
      </>
    );
  }
  // Default content if no error is provided
  else {
    content = (
      <>
        <Flex justifyContent="center" alignItems="center" flex={1} mt={9} mb={6}>
          <BoxedIcon
            Icon={<WarningSolidMedium color="warning.c70" size={32} />}
            variant="circle"
            backgroundColor="neutral.c30"
            borderColor="transparent"
            size={64}
          />
        </Flex>
        <Text textAlign="center" variant="h4" fontWeight="semiBold" mb={4} mt={8}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.title")}
        </Text>
        <Text textAlign="center" variant="bodyLineHeight" mb={8} color="neutral.c80">
          {t("earlySecurityCheck.genuineCheckErrorDrawer.description", {
            productName,
          })}
        </Text>
        <Button type="main" mb={4} onPress={onRetry}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.retryCta")}
        </Button>
        <Button onPress={onCancel}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Button>
      </>
    );
  }

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <TrackScreen category="Error during genuine check" type="drawer" refreshSource={false} />
      {content}
    </QueuedDrawer>
  );
};

export default GenuineCheckErrorDrawer;
