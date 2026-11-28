import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import OpenOrInstallTrustChainApp from "../DeviceActions/openOrInstall";
import { LedgerSyncDeviceStepError } from "../../deviceIntents/LedgerSyncDeviceStepError";

type Props = {
  goNext: (device: Device) => void;
};

export default function DeviceActionInstanceStep({ goNext }: Readonly<Props>) {
  const ledgerSyncDie = useFeature("lwdLedgerSyncDie");

  if (ledgerSyncDie?.enabled) return <LedgerSyncDeviceStepError />;

  return <OpenOrInstallTrustChainApp goNext={goNext} />;
}
