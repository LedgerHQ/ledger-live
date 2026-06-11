import type { Features } from "@shared/feature-flags";

export type ListProvider = NonNullable<
  Features["ethStakingProviders"]["params"]
>["listProvider"][number];
