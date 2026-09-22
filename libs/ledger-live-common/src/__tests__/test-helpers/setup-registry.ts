import "@shared/env";
import { setRateLookup as setAssetAggregationRateLookup } from "@ledgerhq/asset-aggregation/rateLookup";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { registerAllCoins } from "../../coin-modules/load-all-coins";

registerAllCoins();

setAssetAggregationRateLookup({ calculate });
