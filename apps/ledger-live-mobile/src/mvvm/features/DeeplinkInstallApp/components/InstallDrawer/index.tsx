import React from "react";
import { Platform } from "react-native";
import { Box, Text, Button, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import VersionNumber from "react-native-version-number";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import TranslatedError from "~/components/TranslatedError";
import { TrackScreen } from "~/analytics";
import { ConfirmationStep } from "./ConfirmationStep";
import { InstallingContent } from "./InstallingContent";
import { useDeeplinkInstallDrawer } from "./useDeeplinkInstallDrawer";

export function DeeplinkInstallAppDrawer() {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
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
            <Box
              lx={{
                alignItems: "center",
                justifyContent: "center",
                paddingTop: "s32",
                paddingBottom: "s12",
              }}
            >
              <CheckmarkCircleFill size={40} color="success" />
              <Text
                typography="heading5SemiBold"
                lx={{ color: "base", textAlign: "center", marginTop: "s16" }}
              >
                {t("deeplinkInstallApp.success.title", { appName: appConfig.displayName })}
              </Text>
              <Text
                typography="body2"
                lx={{ color: "muted", textAlign: "center", marginTop: "s12" }}
              >
                {t(
                  appConfig.successDescriptionKey ??
                    "deeplinkInstallApp.success.genericDescription",
                  { appName: appConfig.displayName },
                )}
              </Text>
              <Button
                appearance="gray"
                size="lg"
                lx={{ marginTop: "s24", alignSelf: "stretch" }}
                onPress={handleClose}
              >
                {t("common.done")}
              </Button>
            </Box>
          </>
        );

      case "error": {
        return (
          <Box
            lx={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "s32",
              paddingBottom: "s12",
            }}
          >
            <Warning size={40} color="error" />
            <Text
              typography="heading5SemiBold"
              lx={{ color: "base", textAlign: "center", marginTop: "s16" }}
            >
              <TranslatedError error={installError} />
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center", marginTop: "s8" }}>
              <TranslatedError error={installError} field="description" />
            </Text>
            <Button
              appearance="base"
              size="lg"
              lx={{ marginTop: "s16", alignSelf: "stretch" }}
              onPress={handleRetry}
            >
              {t("common.retry")}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              lx={{ marginTop: "s12", alignSelf: "stretch" }}
              onPress={handleClose}
            >
              {t("common.cancel")}
            </Button>
          </Box>
        );
      }

      default:
        return null;
    }
  };

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      preventBackdropClick
      noCloseButton
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: bottomInset }}>
        {isOpen && renderContent()}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
