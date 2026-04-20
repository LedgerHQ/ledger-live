import type { PostOnboardingAction, PostOnboardingActionState, Account } from "@ledgerhq/types-live";
import type { DeviceModelId } from "@ledgerhq/types-devices";

export type PostOnboardingActionRowProps = PostOnboardingAction &
  PostOnboardingActionState & {
    deviceModelId: DeviceModelId;
    productName: string;
    isLedgerSyncActive?: boolean;
    openActivationDrawer?: () => void;
    accounts?: Account[];
  };
