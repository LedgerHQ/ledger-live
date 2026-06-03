import { createApi } from ".";
import { type CardanoConfig } from "../config";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("craftRawTransaction", () => {
  it("throws an unsupported error", () => {
    const api = createApi(config, "cardano");

    expect(() => api.craftRawTransaction("rawTransaction", "sender", "publicKey", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });
});
