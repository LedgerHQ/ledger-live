import { setCoinConfig } from "../config";
import { TEST_VECHAIN_ENDPOINT } from "./constants";

// The module reads its Thor endpoint from the coin config rather than from the environment, so
// tests need one installed before any suite runs. Individual suites override it as needed.
setCoinConfig(() => ({
  status: { type: "active" },
  name: "Vechain",
  unit: { name: "VET", code: "VET", magnitude: 18 },
  node: { url: TEST_VECHAIN_ENDPOINT },
}));
