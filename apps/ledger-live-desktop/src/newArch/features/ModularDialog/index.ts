import { openAssetAndAccountDialog } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import {
  useModularDrawerVisibility,
  ModularDrawerVisibleParams,
} from "@ledgerhq/live-common/modularDrawer/useModularDrawerVisibility";

export type { ModularDrawerVisibleParams };

export { useModularDrawerVisibility, openAssetAndAccountDialog, ModularDrawerLocation };
