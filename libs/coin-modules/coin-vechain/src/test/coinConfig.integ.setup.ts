import { setCoinConfig } from "../config";
import { VECHAIN_ENDPOINT } from "./constants";

// Integration suites talk to the real network, so they get the production endpoint. Suites that
// intercept with MSW override this with their own test host.
setCoinConfig(() => ({
  status: { type: "active" },
  node: { url: VECHAIN_ENDPOINT },
}));
