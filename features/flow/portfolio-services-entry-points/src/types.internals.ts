import type { Feature, Features } from "@shared/feature-flags";
import type { ServiceEntryPointId } from "./types";

export type ServicesEntryPointsFlagParams = NonNullable<Features["entryPointsServices"]["params"]>;

export type ServicesEntryPointsFlag = Feature<ServicesEntryPointsFlagParams> | null | undefined;

export type ServicesAvailability = Readonly<Record<ServiceEntryPointId, boolean>>;

export type PlatformServicesConfig = Readonly<{
  availability: ServicesAvailability;
  isAssetSectionDisplayed: boolean;
}>;
