import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { createMockPrepareTransferResponse } from "../../test/fixtures";
import { decodeCrafted, decodeSigned } from "../envelope";

const PARTY = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const { serialized, json } = createMockPrepareTransferResponse();
const crafted = { party: PARTY, serialized, json };

describe("decodeCrafted", () => {
  it("should round-trip a crafted transfer", () => {
    expect(decodeCrafted(JSON.stringify(crafted))).toEqual(crafted);
  });

  it.each([
    ["not JSON", "not-json"],
    ["a bare string", JSON.stringify("serialized")],
    ["an array", JSON.stringify([crafted])],
    ["without a party", JSON.stringify({ ...crafted, party: "" })],
    ["with an empty serialized transaction", JSON.stringify({ ...crafted, serialized: "" })],
    ["with a string payload", JSON.stringify({ ...crafted, json: "payload" })],
    ["without metadata", JSON.stringify({ ...crafted, json: { transaction: json.transaction } })],
    [
      "shaped like an onboarding",
      JSON.stringify({ ...crafted, json: { ...json, transactions: [] } }),
    ],
  ])("should reject a transaction %s", (_, encoded) => {
    expect(() => decodeCrafted(encoded)).toThrow(InvalidTransactionError);
  });
});

describe("decodeSigned", () => {
  const signed = { party: PARTY, serialized, signature: "ab12" };

  it("should round-trip a signed transaction", () => {
    expect(decodeSigned(JSON.stringify(signed))).toEqual(signed);
  });

  it.each([
    ["without a signature", { ...signed, signature: "" }],
    ["without a party", { party: undefined, serialized, signature: "ab12" }],
    ["without a serialized transaction", { ...signed, serialized: 1 }],
  ])("should reject a transaction %s", (_, value) => {
    expect(() => decodeSigned(JSON.stringify(value))).toThrow(InvalidTransactionError);
  });
});
