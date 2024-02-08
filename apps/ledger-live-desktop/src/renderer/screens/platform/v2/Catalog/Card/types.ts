import { RecentlyUsedManifest } from "@ledgerhq/live-common/wallet-api/react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export interface PropsRawFullCard {
  manifest: LiveAppManifest;
  onClick: (manifest: LiveAppManifest) => void;
}
export interface PropsRawMinimumCard {
  manifest: RecentlyUsedManifest;
  onClick: (manifest: RecentlyUsedManifest) => void;
}

export interface PropsCta {
  text: string;
}
