import coinConfig from "../config";
import { mockKaspaConfig } from "./context";

// Runs as a jest `setupFiles` entry, so every suite resolves the Kaspa endpoint to the test host.
coinConfig.setCoinConfig(() => mockKaspaConfig);
