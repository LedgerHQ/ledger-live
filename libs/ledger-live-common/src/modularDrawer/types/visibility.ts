import { ModularDrawerLocation } from "../enums";

export type ModularDrawerVisibleParams =
  | { location: ModularDrawerLocation.LIVE_APP; liveAppId: string }
  | {
      location: Exclude<ModularDrawerLocation, ModularDrawerLocation.LIVE_APP>;
    };
