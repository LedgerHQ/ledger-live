import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import cosmosConfig from "../families/cosmos/config";

const liveConfig: ConfigSchema = {};

export default { ...liveConfig, ...cosmosConfig } as ConfigSchema;
