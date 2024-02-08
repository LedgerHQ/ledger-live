import { RecentlyUsedManifest } from "@ledgerhq/live-common/wallet-api/react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export interface PropsCard<T extends RecentlyUsedManifest | LiveAppManifest> {
  manifest: T;
  onClick: (manifest: T) => void;
}

export interface PropsCta {
  text: string;
}
