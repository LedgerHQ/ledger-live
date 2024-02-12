import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export interface PropsCard<T extends LiveAppManifest> {
  manifest: T;
  onClick: (manifest: LiveAppManifest) => void;
}

export interface PropsCta {
  text: string;
}
