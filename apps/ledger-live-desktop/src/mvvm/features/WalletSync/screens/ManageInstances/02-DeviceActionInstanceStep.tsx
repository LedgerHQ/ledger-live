import React from "react";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFeature } from "@features/platform-feature-flags";
import OpenOrInstallTrustChainApp from "../DeviceActions/openOrInstall";
import { RemoveMemberIntentStep } from "../../deviceIntents/removeMemberIntent/RemoveMemberIntentStep";

type Props = {
  goNext: (device: Device) => void;
  instance: TrustchainMember | null;
};

export default function DeviceActionInstanceStep({ goNext, instance }: Readonly<Props>) {
  const ledgerSyncDie = useFeature("lwdLedgerSyncDie");

  if (ledgerSyncDie?.enabled) return <RemoveMemberIntentStep member={instance} />;

  return <OpenOrInstallTrustChainApp goNext={goNext} />;
}
