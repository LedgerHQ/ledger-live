import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Routes, Route, useParams } from "react-router";
import CompletionScreen from "LLD/features/Onboarding/screens/SyncOnboardingCompletion";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import SyncOnboardingDeviceConnection from "./DeviceConnection";
import SyncOnboardingManual from "./Manual";
import { useKeepScreenAwake } from "~/renderer/hooks/useKeepScreenAwake";

// Wrapper components to extract params from URL and pass to children
const ManualWrapper = () => {
  const { deviceModelId } = useParams<{ deviceModelId: string }>();
  return <SyncOnboardingManual deviceModelId={deviceModelId ?? ""} />;
};

const DeviceConnectionWrapper = () => {
  const { deviceModelId } = useParams<{ deviceModelId: string }>();
  return <SyncOnboardingDeviceConnection deviceModelId={deviceModelId ?? ""} />;
};

const SyncOnboarding = () => {
  useKeepScreenAwake(true);

  return (
    <Flex width="100%" height="100%" position="relative">
      <Routes>
        <Route path="manual/:deviceModelId" element={<ManualWrapper />} />
        <Route path="completion" element={<CompletionScreen />} />
        <Route path="connection/:deviceModelId" element={<DeviceConnectionWrapper />} />
        <Route path=":deviceModelId" element={<DeviceConnectionWrapper />} />
      </Routes>
    </Flex>
  );
};

export default withV3StyleProvider(SyncOnboarding);
