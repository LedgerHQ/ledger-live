import { Account } from "@ledgerhq/types-live";
import { EvmResources, EvmResourcesRaw } from "./resources";

export type EvmAccount = Account & {
  evmResources?: EvmResources;
};

export type EvmAccountRaw = {
  evmResources?: EvmResourcesRaw;
};
