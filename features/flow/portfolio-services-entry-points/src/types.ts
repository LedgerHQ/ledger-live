import type { Features } from "@shared/feature-flags";

export type ServicesEntryPointsFlagParams = NonNullable<Features["entryPointsServices"]["params"]>;

export type ServiceEntryPointId = "perps" | "borrow";

export type ServicesAvailability = Readonly<Record<ServiceEntryPointId, boolean>>;
