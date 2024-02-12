import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import cosmosConfig from "../families/cosmos/config";

const liveCommonConfig: ConfigSchema = {};

export default { ...liveCommonConfig, ...cosmosConfig } as ConfigSchema;
