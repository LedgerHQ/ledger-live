import { createApi } from ".";
import { type CardanoConfig } from "../config";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("validateAddress", () => {
  it("throws an unsupported error", () => {
    const api = createApi(config, "cardano");

    expect(() => api.validateAddress("address", {})).toThrow("validateAddress is not supported");
  });
});
