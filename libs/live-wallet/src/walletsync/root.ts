import { z } from "zod";
import { ExtractLocalState, ExtractSchema, ExtractUpdateEvent } from "./types";
import { createAggregator } from "./aggregator";

// Maintain here the list of modules to aggregate for WalletSync data
// New modules can be added over time, it's also possible to remove modules but don't replace modules because the schema of a field must not change.

import accounts from "./modules/accounts";
import accountNames from "./modules/accountNames";

const modules = {
  accounts,
  accountNames,
};

/**
 * This is the root WalletSyncDataManager that manage the data as a whole
 * for all the different fields and delegate/dispatch/aggregate the data
 * to each module.
 */
const root = createAggregator(modules);

type Root = typeof root;
export type LocalState = ExtractLocalState<Root>;
export type UpdateEvent = ExtractUpdateEvent<Root>;
export type Schema = ExtractSchema<Root>;
export type DistantState = z.infer<Schema>;

export default root;
