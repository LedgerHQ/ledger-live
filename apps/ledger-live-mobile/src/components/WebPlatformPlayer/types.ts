import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

export interface RootProps {
  manifest: AppManifest;
  inputs?: Record<string, string>;
  hideHeader?: boolean;
}
