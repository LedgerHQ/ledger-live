import coinConfig from "../config";
import { mainnetFilecoinConfig } from "./context";

// Integration suites run against the production Filecoin API.
coinConfig.setCoinConfig(() => mainnetFilecoinConfig);
