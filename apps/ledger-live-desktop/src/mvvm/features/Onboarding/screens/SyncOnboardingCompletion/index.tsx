import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import TrackPage from "~/renderer/analytics/TrackPage";
import { analyticsFlowName } from "../SyncOnboardingCompanion/utils/constants/analytics";
import ApexCompletionView from "./components/ApexCompletionView";
import EuropaCompletionView from "./components/EuropaCompletionView";
import StaxCompletionView from "./components/StaxCompletionView";
import { useCompletionScreenViewModel, ViewProps } from "./useCompletionScreenViewModel";

function OnboardingSuccessView({ deviceModelId }: Readonly<{ deviceModelId: DeviceModelId }>) {
  switch (deviceModelId) {
    case DeviceModelId.stax:
      return <StaxCompletionView />;
    case DeviceModelId.europa:
      return <EuropaCompletionView />;
    case DeviceModelId.apex:
      return <ApexCompletionView />;
    default:
      return null;
  }
}

function View({ seedConfiguration, deviceModelId }: Readonly<ViewProps>) {
  return (
    <Flex alignItems="center" justifyContent="center" width="100%">
      <TrackPage
        category={`End of onboarding`}
        flow={analyticsFlowName}
        seedConfiguration={seedConfiguration}
      />
      <OnboardingSuccessView deviceModelId={deviceModelId} />
    </Flex>
  );
}

const CompletionScreen = () => <View {...useCompletionScreenViewModel()} />;

export default CompletionScreen;
