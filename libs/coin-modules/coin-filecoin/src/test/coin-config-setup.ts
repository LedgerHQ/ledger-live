import coinConfig from "../config";
import { mockFilecoinConfig } from "./context";

// Runs as a jest `setupFiles` entry, so the network layer always resolves an endpoint: suites mock
// the network, and the test host never reaches a real server.
coinConfig.setCoinConfig(() => mockFilecoinConfig);
