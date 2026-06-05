import { createApi } from ".";
import { type CardanoConfig } from "../config";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("getNextSequence", () => {
  it("throws — Cardano is UTXO-based with no account sequence to advance", () => {
    const api = createApi(config, "cardano");

    expect(() => api.getNextSequence("address")).toThrow(
      "getNextSequence is not applicable for Cardano",
    );
  });
});
