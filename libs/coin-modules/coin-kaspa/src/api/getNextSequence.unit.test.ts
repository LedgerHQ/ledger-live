import { createApi } from ".";
import type { KaspaCoinConfig } from "../config";

const config: KaspaCoinConfig = { status: { type: "active" } };

describe("getNextSequence", () => {
  it("throws — Kaspa is UTXO-based with no account sequence/nonce to advance", () => {
    const api = createApi(config, "kaspa");

    expect(() => api.getNextSequence("kaspa:qpy827u4r43hp36nu2w78dphwgzjr3e9xdwwvm7k7dalyhpfkr84qucn4ecud")).toThrow(
      "getNextSequence is not applicable for Kaspa",
    );
  });
});
