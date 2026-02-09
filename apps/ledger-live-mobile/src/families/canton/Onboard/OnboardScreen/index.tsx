import { Button, Flex } from "@ledgerhq/native-ui";
import React from "react";
import DeviceActionModal from "~/components/DeviceActionModal";
import { Trans } from "~/context/Locale";
import { ContentSection, ProcessingScreen } from "./components";
import { useContentSectionViewModel } from "./hooks/useContentSectionViewModel";
import type { OnboardScreenProps } from "./types";
import { useOnboardScreenViewModel } from "./useOnboardScreenViewModel";

export default function OnboardScreen({ navigation, route }: OnboardScreenProps) {
  const viewModel = useOnboardScreenViewModel({ navigation, route });

  const contentSectionViewModel = useContentSectionViewModel({
    status: {
      onboarding: viewModel.onboardingStatus,
      authorize: viewModel.authorizeStatus,
      hasResult: !!viewModel.onboardResult,
    },
    isReonboarding: viewModel.isReonboarding,
    error: viewModel.error,
  });

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
          viewModel={contentSectionViewModel}
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

export { useOnboardScreenViewModel } from "./useOnboardScreenViewModel";
