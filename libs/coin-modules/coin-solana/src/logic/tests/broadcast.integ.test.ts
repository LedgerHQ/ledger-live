import { createApi } from "../../api";

const api = createApi(
  {
    token2022Enabled: false,
    legacyOCMSMaxVersion: "1.0.0",
    status: { type: "active" },
  },
  "solana",
);

describe("broadcast", () => {
  it("should reject an invalid transaction with a deserialization error", async () => {
    const invalidTx = Buffer.from("invalid-transaction-bytes").toString("base64");

    await expect(api.broadcast(invalidTx)).rejects.toThrow(/failed to deserialize/i);
  });
});
