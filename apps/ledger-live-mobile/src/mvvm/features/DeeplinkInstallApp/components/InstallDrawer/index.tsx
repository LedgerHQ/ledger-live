import React from "react";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { ConfirmationStep } from "./ConfirmationStep";
import { InstallingContent } from "./InstallingContent";
import { SuccessStep } from "./SuccessStep";
import { ErrorStep } from "./ErrorStep";
import { useDeeplinkInstallDrawer } from "./useDeeplinkInstallDrawer";

export function DeeplinkInstallAppDrawer() {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const {
    isOpen,
    step,
    device,
    deviceModelId,
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
    // QueuedDrawerBottomSheet renders children even when closed
    if (!isOpen) return null;

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
          <SuccessStep appConfig={appConfig} deviceModelId={deviceModelId} onClose={handleClose} />
        );

      case "error":
        return <ErrorStep error={installError} onRetry={handleRetry} onCancel={handleClose} />;

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
      <BottomSheetView style={{ paddingBottom: bottomInset }}>{renderContent()}</BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
