import { setupTestnetCoinConfig } from "../../test/fixtures";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  beforeAll(() => {
    setupTestnetCoinConfig();
  });

  it("throws when broadcasting a valid tx with an invalid signature", async () => {
    const signedTx = JSON.stringify({
      transactionBody:
        "44ecadfc705f1fdb3133fc1e48db5d93273fc925d1c082b6661c9b291c9e2bd1" +
        "0000000000000001" +
        "00000000000001f4" +
        "00000029" +
        "0000000001000000" +
        "03f5b149f64e3a43759bd78776e84fd393d4a8c07010b5925c261d638d1723dcd1" +
        "00000000000f4240",
      signature: "00".repeat(64),
    });

    await expect(broadcast(signedTx, "concordium")).rejects.toThrow(/^1$/);
  });
});
