import React from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFeature } from "@features/platform-feature-flags";
import OpenOrInstallTrustChainApp from "../DeviceActions/openOrInstall";
import { AddMemberIntentStep } from "../../deviceIntents/addMemberIntent/AddMemberIntentStep";
import type { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";

type Props = {
  goNext: (device: Device) => void;
  sourcePage?: AnalyticsPage;
};

export default function DeviceActionStep({ goNext, sourcePage }: Readonly<Props>) {
  const ledgerSyncDie = useFeature("lwdLedgerSyncDie");

  if (ledgerSyncDie?.enabled) return <AddMemberIntentStep sourcePage={sourcePage} />;

  return <OpenOrInstallTrustChainApp goNext={goNext} />;
}
