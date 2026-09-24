import coinConfig from "../config";
import { mainnetKaspaConfig } from "./context";

// Integration suites run against the production Kaspa API.
coinConfig.setCoinConfig(() => mainnetKaspaConfig);
