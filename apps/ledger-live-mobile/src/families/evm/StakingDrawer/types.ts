import { Feature_EthStakingProviders } from "@ledgerhq/types-live";

export type ListProvider = NonNullable<
  Feature_EthStakingProviders["params"]
>["listProvider"][number];
