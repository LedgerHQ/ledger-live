import React, { useCallback } from "react";
import { Button, Flex, Icons, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen, track } from "~/analytics";
import GenericErrorView from "~/components/GenericErrorView";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import { BluetoothRequired, FirmwareNotRecognized } from "@ledgerhq/errors";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import type { SyncOnboardingScreenProps } from ".";

export type Props = {
  /**
   * State to trigger the opening/closing of the drawer
   */
  isOpen: boolean;

  /**
   * Callback when the user wants to retry the genuine check and presses on the retry button
   */
  onRetry: () => void;

  /**
   * Callback when the user wants to cancel the genuine check step and presses on the cancel button
   */
  onCancel: () => void;

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
    track("button_clicked", {
      button: "Go to settings",
      page: "Error: Ledger Stax OS version not recognized",
    });
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.ExperimentalSettings,
      },
    });
  }, [navigation]);

  let content;

  const screenName = isNotFoundEntity
    ? "Error: Device OS version not recognized"
    : error
    ? "`Error: ${(error as unknown as Error).name}`"
    : "Error: unknown error";

  const handleRetry = () => {
    track("button_clicked", {
      button: "Try again",
      page: screenName,
    });
    onRetry();
  };

  const handleCancel = () => {
    track("button_clicked", {
      button: "Cancel",
      page: screenName,
    });
    onCancel();
  };

  // Special case for the genuine check during the ESC
  if (isNotFoundEntity) {
    content = (
      <>
        <Flex justifyContent="center" alignItems="center" mt={10}>
          <GenericInformationBody
            title={t("earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.title")}
            description={t(
              "earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.description",
              {
                productName,
              },
            )}
          />
        </Flex>
        <Button type="main" mt={8} mb={7} size={"large"} onPress={onGoToSettings}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.notFoundEntity.settingsCta")}
        </Button>
        <Link onPress={handleCancel} size={"large"}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Link>
      </>
    );
  }
  // Generic error management
  else if (error) {
    content = (
      <Flex mt={7}>
        <GenericErrorView
          error={error}
          Icon={Icons.WarningFill}
          iconColor="warning.c70"
          hasExportLogButton={false}
        />
        <Button
          type="main"
          mt={(error as unknown as Error) instanceof BluetoothRequired ? 6 : 8}
          mb={7}
          size={"large"}
          onPress={handleRetry}
        >
          {t("earlySecurityCheck.genuineCheckErrorDrawer.retryCta")}
        </Button>
        <Link onPress={handleCancel} size="large">
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Link>
      </Flex>
    );
  }
  // Default content if no error is provided
  else {
    content = (
      <>
        <Flex justifyContent="center" alignItems="center" mt={10}>
          <GenericInformationBody
            title={t("earlySecurityCheck.genuineCheckErrorDrawer.title")}
            description={t("earlySecurityCheck.genuineCheckErrorDrawer.description", {
              productName,
            })}
            Icon={Icons.WarningFill}
            iconColor={"warning.c70"}
          />
        </Flex>
        <Button type="main" mt={8} mb={7} size={"large"} onPress={handleRetry}>
          {t("earlySecurityCheck.genuineCheckErrorDrawer.retryCta")}
        </Button>
        <Link onPress={handleCancel} size="large">
          {t("earlySecurityCheck.genuineCheckErrorDrawer.cancelCta")}
        </Link>
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
      <TrackScreen name={screenName} type="drawer" refreshSource={false} />
      {content}
    </QueuedDrawer>
  );
};

export default GenuineCheckErrorDrawer;
