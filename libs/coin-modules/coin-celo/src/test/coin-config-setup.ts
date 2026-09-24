import { setCoinConfig } from "../config";
import { mockCeloConfig } from "./context";

// Runs as a jest `setupFiles` entry, so the account bridge always resolves its endpoints.
setCoinConfig(() => ({ info: mockCeloConfig }));
