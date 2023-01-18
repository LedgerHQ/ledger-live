import { LiveAppManifest } from "../../types";

export type LiveAppRegistry = {
  liveAppById: { [appId: string]: LiveAppManifest };
  liveAppByIndex: LiveAppManifest[];
};

export type LiveAppDataAPI = {
  fetchLiveAppManifests: (url: string) => Promise<LiveAppManifest[]>;
};
