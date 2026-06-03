import { broadcast } from "./broadcast";

describe("broadcast (integration)", () => {
  it("rejects a malformed transaction with an error (not silent failure)", async () => {
    const malformedTx = JSON.stringify({
      message: {
        version: 0,
        to: "f099",
        from: "f099",
        nonce: 0,
        value: "0",
        gaslimit: 0,
        gasfeecap: "0",
        gaspremium: "0",
        method: 0,
        params: "",
      },
      signature: { type: 1, data: "aW52YWxpZA==" },
    });

    await expect(broadcast(malformedTx)).rejects.toThrow();
  });
});
