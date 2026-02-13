import { Button, Flex } from "@ledgerhq/native-ui";
import React from "react";
import DeviceActionModal from "~/components/DeviceActionModal";
import { Trans } from "~/context/Locale";
import { ContentSection, ProcessingScreen } from "./components";
import type { OnboardScreenProps } from "./types";
import { useOnboardScreenViewModel } from "./useOnboardScreenViewModel";

function OnboardScreenView({
  isNetworkProcessing,
  showDeviceModal,
  device,
  action,
  deviceActionRequest,
  accountsToDisplay,
  selectedIds,
  isReonboarding,
  isProcessing,
  error,
  retryOnboarding,
  handleConfirm,
  confirmDisabled,
  displayStatus,
  showError,
  successKey,
  statusTranslationKey,
}: ReturnType<typeof useOnboardScreenViewModel>) {
  if (isNetworkProcessing) {
    return <ProcessingScreen />;
  }

  if (showDeviceModal) {
    return (
      <DeviceActionModal
        device={device}
        action={action}
        request={deviceActionRequest}
        preventBackdropClick
        noCloseButton
      />
    );
  }

  return (
    <Flex
      flexDirection="column"
      alignItems="stretch"
      flex={1}
      justifyContent="space-between"
      pb={10}
    >
      <Flex flexDirection="column" alignItems="stretch" flex={1}>
        <ContentSection
          isProcessing={isProcessing}
          accounts={accountsToDisplay}
          selectedIds={selectedIds}
          isReonboarding={isReonboarding}
          error={error}
          onRetry={retryOnboarding}
          displayStatus={displayStatus}
          showError={showError}
          successKey={successKey}
          statusTranslationKey={statusTranslationKey}
        />
      </Flex>
      <Flex px={6}>
        <Button type="main" onPress={handleConfirm} disabled={confirmDisabled}>
          <Trans i18nKey="common.confirm" />
        </Button>
      </Flex>
    </Flex>
  );
}

export default function OnboardScreen(props: OnboardScreenProps) {
  return <OnboardScreenView {...useOnboardScreenViewModel(props)} />;
}

export { useOnboardScreenViewModel } from "./useOnboardScreenViewModel";
