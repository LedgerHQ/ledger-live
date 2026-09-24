import coinConfig from "../config";
import { getMockAptosBridgeConfig } from "./coinConfig";

// The bridge resolves its endpoints through the coin config the app seeds.
coinConfig.setCoinConfig(getMockAptosBridgeConfig);
