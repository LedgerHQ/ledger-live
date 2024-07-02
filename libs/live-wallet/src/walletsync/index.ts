import { z } from "zod";
import { ExtractLocalState, ExtractSchema, ExtractUpdateEvent } from "./types";
import { createAggregator } from "./aggregator";

// Maintain here the list of modules to aggregate for WalletSync data

import accounts from "./modules/accounts";
import accountNames from "./modules/accountNames";

const modules = {
  accounts,
  accountNames,
};

////////////////////////////////////////////////////////////////////////

const root = createAggregator(modules);

type Root = typeof root;
export type LocalState = ExtractLocalState<Root>;
export type UpdateEvent = ExtractUpdateEvent<Root>;
export type Schema = ExtractSchema<Root>;
export type DistantState = z.infer<Schema>;

export default root;
