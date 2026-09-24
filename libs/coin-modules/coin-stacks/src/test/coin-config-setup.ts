import { setCoinConfig } from "../config";
import { mockStacksConfig } from "./context";

// Runs as a jest `setupFiles` entry, before any suite loads, so the account bridge always resolves
// the mocked endpoint.
setCoinConfig(() => mockStacksConfig);
