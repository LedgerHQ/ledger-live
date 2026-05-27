import { combine } from "./combine";
import type { FilecoinCraftedMessage } from "./craftTransaction";

const CRAFTED_MESSAGE: FilecoinCraftedMessage = {
  cbor: "base64encodedcbor==",
  message: {
    version: 0,
    to: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
    from: "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za",
    nonce: 5,
    value: "100000000000000000",
    gasLimit: 1000000,
    gasFeeCap: "100000",
    gasPremium: "100000",
    method: 0,
    params: "",
  },
  signatureType: 1,
};

const SIGNATURE = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("combine", () => {
  it("produces a valid broadcast request JSON from crafted tx + signature", () => {
    const result = combine(JSON.stringify(CRAFTED_MESSAGE), SIGNATURE);
    const parsed = JSON.parse(result);

    expect(parsed.message.version).toBe(0);
    expect(parsed.message.to).toBe(CRAFTED_MESSAGE.message.to);
    expect(parsed.message.from).toBe(CRAFTED_MESSAGE.message.from);
    expect(parsed.message.nonce).toBe(CRAFTED_MESSAGE.message.nonce);
    expect(parsed.message.value).toBe(CRAFTED_MESSAGE.message.value);
    expect(parsed.message.gaslimit).toBe(CRAFTED_MESSAGE.message.gasLimit);
    expect(parsed.message.gasfeecap).toBe(CRAFTED_MESSAGE.message.gasFeeCap);
    expect(parsed.message.gaspremium).toBe(CRAFTED_MESSAGE.message.gasPremium);
    expect(parsed.message.method).toBe(CRAFTED_MESSAGE.message.method);
    expect(parsed.message.params).toBe(CRAFTED_MESSAGE.message.params);
    expect(parsed.signature.type).toBe(CRAFTED_MESSAGE.signatureType);
    expect(parsed.signature.data).toBe(SIGNATURE);
  });

  it("ignores the optional pubkey argument", () => {
    const withPubkey = combine(JSON.stringify(CRAFTED_MESSAGE), SIGNATURE, "somepubkey");
    const withoutPubkey = combine(JSON.stringify(CRAFTED_MESSAGE), SIGNATURE);

    expect(JSON.parse(withPubkey)).toEqual(JSON.parse(withoutPubkey));
  });

  it("throws on invalid crafted tx JSON", () => {
    expect(() => combine("not-json", SIGNATURE)).toThrow(SyntaxError);
  });
});
