import { createMockCantonCurrency, setupMockCoinConfig } from "../../test/fixtures";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  beforeAll(() => {
    setupMockCoinConfig();
  });

  it("throws when submitting with an invalid party id", async () => {
    const currency = createMockCantonCurrency();
    const signedTx = JSON.stringify({
      serialized: "garbage-serialized",
      signature: "garbage-sig__PARTY__fake-party-id",
    });

    await expect(broadcast(currency, signedTx)).rejects.toThrow(
      /Invalid value for: path parameter party_id/,
    );
  });
});
