import React from "react";
import { Platform } from "react-native";
import { Flex, Text, Icons, Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import VersionNumber from "react-native-version-number";
import QueuedDrawer from "~/components/QueuedDrawer";
import { TrackScreen } from "~/analytics";
import { ConfirmationStep } from "./ConfirmationStep";
import { InstallingContent } from "./InstallingContent";
import { useDeeplinkInstallDrawer } from "./useDeeplinkInstallDrawer";

export function DeeplinkInstallAppDrawer() {
  const { t } = useTranslation();
  const {
    isOpen,
    step,
    device,
    installError,
    installKey,
    appConfig,
    handleClose,
    handleConfirm,
    handleRetry,
    handleInstallSuccess,
    handleInstallError,
  } = useDeeplinkInstallDrawer();

  if (!appConfig) {
    return null;
  }

  const renderContent = () => {
    switch (step) {
      case "confirmation":
        return (
          <ConfirmationStep
            appConfig={appConfig}
            onConfirm={handleConfirm}
            onCancel={handleClose}
          />
        );

      case "installing":
        if (!device) return null;
        return (
          <InstallingContent
            key={installKey}
            device={device}
            appConfig={appConfig}
            onSuccess={handleInstallSuccess}
            onError={handleInstallError}
          />
        );

      case "success":
        return (
          <>
            <TrackScreen
              category="DeeplinkInstallApp"
              name="success"
              source="Universal Link"
              device={device?.modelId}
              equipmentOS={Platform.OS}
              LLVersion={VersionNumber.appVersion}
            />
            <Flex alignItems="center" justifyContent="center" pt={8} pb={4}>
              <Icons.CheckmarkCircle size="L" color="success.c50" />
              <Text variant="h5" fontWeight="semiBold" textAlign="center" mt={6}>
                {t("deeplinkInstallApp.success.title", { appName: appConfig.displayName })}
              </Text>
              <Text variant="paragraph" color="neutral.c70" textAlign="center" mt={4}>
                {t(
                  appConfig.successDescriptionKey ?? "deeplinkInstallApp.success.genericDescription",
                  { appName: appConfig.displayName },
                )}
              </Text>
              <Button size="medium" type="shade" mt={7} alignSelf="stretch" onPress={handleClose}>
                {t("common.done")}
              </Button>
            </Flex>
          </>
        );

      case "error":
        return (
          <Flex alignItems="center" justifyContent="center" pt={8} pb={4}>
            <Icons.Warning size="L" color="error.c50" />
            <Text variant="h5" fontWeight="semiBold" textAlign="center" mt={6}>
              {t("deeplinkInstallApp.error.title", { appName: appConfig.displayName })}
            </Text>
            <Text variant="paragraph" color="neutral.c70" textAlign="center" mt={3}>
              {installError?.message ?? t("deeplinkInstallApp.error.description")}
            </Text>
            <Button size="medium" type="main" mt={6} alignSelf="stretch" onPress={handleRetry}>
              {t("common.retry")}
            </Button>
          </Flex>
        );

      default:
        return null;
    }
  };

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      preventBackdropClick={true}
      noCloseButton={true}
    >
      {renderContent()}
    </QueuedDrawer>
  );
}
