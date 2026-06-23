import { combine } from "./combine";

jest.mock("@ledgerhq/logs");

// craftTransaction now emits JSON.stringify({ cbor, message }). The signer
// signs the `cbor` bytes; combine reads `message` to rebuild the request.
function makeTx(): string {
  return JSON.stringify({
    cbor: "Y2JvcmJ5dGVz",
    message: {
      version: 0,
      to: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      from: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
      nonce: 1,
      value: "1000000000000000000",
      gasLimit: 1_500_000,
      gasFeeCap: "150000",
      gasPremium: "125000",
      method: 0,
      params: "",
    },
  });
}

describe("combine", () => {
  it("attaches signature to produce a BroadcastTransactionRequest JSON", () => {
    const tx = makeTx();
    const sig = "c2lnbmF0dXJlZGF0YQ==";

    const result = combine(tx, sig);
    const parsed = JSON.parse(result);

    expect(parsed.signature).toEqual({ type: 1, data: sig });
    expect(parsed.message.nonce).toBe(1);
    expect(parsed.message.from).toBe("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za");
  });

  it("output is consumable by broadcast (round-trip shape check)", () => {
    const tx = makeTx();
    const result = combine(tx, "dGVzdA==");
    const parsed = JSON.parse(result);

    expect(typeof parsed.message.gaslimit).toBe("number");
    expect(typeof parsed.message.gasfeecap).toBe("string");
    expect(typeof parsed.message.value).toBe("string");
    expect(parsed.signature.type).toBe(1);
  });
});
