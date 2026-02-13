import { Button, Flex } from "@ledgerhq/native-ui";
import React from "react";
import DeviceActionModal from "~/components/DeviceActionModal";
import { Trans } from "~/context/Locale";
import { ContentSection, ProcessingScreen } from "./components";
import type { OnboardScreenProps } from "./types";
import { useOnboardScreenViewModel } from "./useOnboardScreenViewModel";

function OnboardScreenView(viewModel: ReturnType<typeof useOnboardScreenViewModel>) {
  if (viewModel.isNetworkProcessing) {
    return <ProcessingScreen />;
  }

  if (viewModel.showDeviceModal) {
    return (
      <DeviceActionModal
        device={viewModel.device}
        action={viewModel.action}
        request={viewModel.deviceActionRequest}
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
          status={{
            onboarding: viewModel.onboardingStatus,
            authorize: viewModel.authorizeStatus,
            isProcessing: viewModel.isProcessing,
            hasResult: !!viewModel.onboardResult,
          }}
          accounts={{
            toDisplay: viewModel.accountsToDisplay,
            selectedIds: viewModel.selectedIds,
            isReonboarding: viewModel.isReonboarding,
          }}
          error={viewModel.error}
          onRetry={viewModel.retryOnboarding}
          viewModel={viewModel.contentSectionViewModel}
        />
      </Flex>
      <Flex px={6}>
        <Button type="main" onPress={viewModel.handleConfirm} disabled={viewModel.confirmDisabled}>
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
