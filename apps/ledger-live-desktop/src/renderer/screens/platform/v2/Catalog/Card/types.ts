import { RecentlyUsedManifest } from "@ledgerhq/live-common/wallet-api/react";

export interface PropsRaw {
  manifest: RecentlyUsedManifest;
  onClick: (manifest: RecentlyUsedManifest) => void;
}

export interface PropsCta {
  text: string;
}
