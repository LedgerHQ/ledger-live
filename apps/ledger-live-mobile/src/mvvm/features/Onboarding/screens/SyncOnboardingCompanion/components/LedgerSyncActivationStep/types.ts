import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SeedOriginType } from "@ledgerhq/types-live";

export type LedgerSyncActivationStepProps = {
  handleContinue: () => void;
  isLedgerSyncActive: boolean;
  device: Device;
  analyticsSeedConfiguration: React.RefObject<SeedOriginType | undefined>;
};
