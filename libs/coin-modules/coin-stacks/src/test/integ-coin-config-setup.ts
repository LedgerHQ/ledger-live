import { setCoinConfig } from "../config";
import { mainnetStacksConfig } from "./context";

// Integration suites run against the production Stacks API.
setCoinConfig(() => mainnetStacksConfig);
