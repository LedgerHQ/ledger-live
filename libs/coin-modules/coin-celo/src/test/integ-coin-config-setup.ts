import { setCoinConfig } from "../config";
import { mainnetCeloConfig } from "./context";

// Integration suites run against the production Celo node, explorer and indexer.
setCoinConfig(() => ({ info: mainnetCeloConfig }));
