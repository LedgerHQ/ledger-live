import React, { useEffect } from "react";
import { trackPage } from "~/renderer/analytics/segment";
import { CharonStatus } from "@ledgerhq/live-common/hw/extractOnboardingState";
import NewSeedStep from "./NewSeedStep";
import ChoiceRestoreRecoverStep from "./ChoiceRestoreRecoverStep";
import RestoreSeedStep from "./RestoreSeedStep";
import RecoverSeedStep from "./RecoverSeedStep";
import BackupCharonStep from "./BackupCharonStep";
import RestoreCharonStep from "./RestoreCharonStep";
import SelectionStep from "./SelectionStep";
import { SeedPathStatus } from "../../types";

export type Props = {
  seedPathStatus: SeedPathStatus;
  deviceName: string;
  deviceIcon: React.ComponentType<{ size: number; color?: string }>;
  charonSupported: boolean;
  charonStatus: CharonStatus | null;
};

const SeedStep = ({
  seedPathStatus,
  deviceName: productName,
  deviceIcon,
  charonSupported,
  charonStatus,
}: Props) => {
  useEffect(() => {
    if (seedPathStatus == "backup_charon" && charonSupported) {
      switch (charonStatus) {
        case CharonStatus.Choice:
          trackPage(`Set up ${productName}: Step 3 Charon Start`, undefined, null, true, true);
          return;
        case CharonStatus.Rejected:
          trackPage(
            `Set up ${productName}: Step 3 Charon Backup Rejected`,
            undefined,
            null,
            true,
            true,
          );
          return;
        case CharonStatus.Ready:
          trackPage(
            `Set up ${productName}: Step 3 Charon Backup Success`,
            undefined,
            null,
            true,
            true,
          );
          return;
        default:
          return;
      }
    }
  }, [seedPathStatus, charonSupported, charonStatus, productName]);

  if (seedPathStatus === "new_seed") {
    return <NewSeedStep productName={productName} deviceIcon={deviceIcon} />;
  }

  if (seedPathStatus === "choice_restore_direct_or_recover") {
    return (
      <ChoiceRestoreRecoverStep
        productName={productName}
        deviceIcon={deviceIcon}
        charonSupported={charonSupported}
      />
    );
  }

  if (seedPathStatus === "restore_seed") {
    return <RestoreSeedStep productName={productName} deviceIcon={deviceIcon} />;
  }

  if (seedPathStatus === "recover_seed") {
    return <RecoverSeedStep />;
  }

  if (seedPathStatus === "backup_charon") {
    return <BackupCharonStep productName={productName} deviceIcon={deviceIcon} />;
  }

  if (seedPathStatus === "restore_charon") {
    return <RestoreCharonStep productName={productName} deviceIcon={deviceIcon} />;
  }

  return (
    <SelectionStep
      productName={productName}
      deviceIcon={deviceIcon}
      charonSupported={charonSupported}
    />
  );
};

export default SeedStep;
