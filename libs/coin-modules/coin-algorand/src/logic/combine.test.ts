import { decode } from "algo-msgpack-with-bigint";
import { combine } from "./combine";

describe("combine", () => {
  it("should produce a valid hex-encoded signed transaction", () => {
    const txPayload = {
      amt: 1000000,
      fee: 1000,
      fv: 100,
      lv: 1100,
      snd: Buffer.from("sender"),
      rcv: Buffer.from("recipient"),
      type: "pay",
    };

    const unsignedTx = Buffer.from(JSON.stringify(txPayload)).toString("hex");
    const signature = Buffer.from("mock_signature_64_bytes_long_padding_here_12345678").toString(
      "hex",
    );

    const result = combine(unsignedTx, signature);

    expect(result).toMatch(/^[a-f0-9]+$/i);

    const decoded = decode(Buffer.from(result, "hex")) as { sig: Uint8Array; txn: typeof txPayload };

    expect(decoded.txn.amt).toBe(txPayload.amt);
    expect(decoded.txn.fee).toBe(txPayload.fee);
    expect(decoded.txn.fv).toBe(txPayload.fv);
    expect(decoded.txn.lv).toBe(txPayload.lv);
    expect(decoded.txn.type).toBe("pay");
    expect(Buffer.from(decoded.sig).toString("hex")).toBe(signature);
  });

  it("should preserve asset transfer fields in the signed transaction", () => {
    const txPayload = {
      type: "axfer",
      amt: 500,
      fee: 1000,
      xaid: 12345,
      snd: Buffer.from("sender"),
      arcv: Buffer.from("recipient"),
    };

    const unsignedTx = Buffer.from(JSON.stringify(txPayload)).toString("hex");
    const signature = "abcd1234";

    const result = combine(unsignedTx, signature);

    const decoded = decode(Buffer.from(result, "hex")) as { sig: Uint8Array; txn: typeof txPayload };

    expect(decoded.txn.type).toBe("axfer");
    expect(decoded.txn.amt).toBe(txPayload.amt);
    expect(decoded.txn.fee).toBe(txPayload.fee);
    expect(decoded.txn.xaid).toBe(txPayload.xaid);
    expect(Buffer.from(decoded.sig).toString("hex")).toBe(signature);
  });
});
