import { combine } from "./combine";

describe("combine", () => {
  const message = {
    version: 0,
    to: "f1recipient",
    from: "f1sender",
    nonce: 5,
    value: "2000",
    gaslimit: 50000,
    gasfeecap: "200",
    gaspremium: "20",
    method: 0,
    params: "",
  };

  it("assembles message and signature into BroadcastTransactionRequest JSON", () => {
    const transaction = JSON.stringify(message);
    const signature = "base64sig==";

    const result = combine(transaction, signature);
    const parsed = JSON.parse(result);

    expect(parsed.message).toEqual(message);
    expect(parsed.signature).toEqual({ type: 1, data: "base64sig==" });
  });

  it("always uses signature type 1 (secp256k1)", () => {
    const result = combine(JSON.stringify(message), "anysig");
    const parsed = JSON.parse(result);
    expect(parsed.signature.type).toBe(1);
  });

  it("output of combine can be parsed by broadcast", () => {
    const result = combine(JSON.stringify(message), "sig");
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("message");
    expect(parsed).toHaveProperty("signature");
    expect(parsed.message).toHaveProperty("to");
    expect(parsed.message).toHaveProperty("from");
  });
});
