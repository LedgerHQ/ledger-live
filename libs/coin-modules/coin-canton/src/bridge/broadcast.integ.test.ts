import { cantonDefaults } from "../config";
import { createMockCantonAccount, createMockContext } from "../test/fixtures";
import { broadcast } from "./broadcast";

describe("Broadcast", () => {
  it("throws when submitting with an invalid party id", async () => {
    const account = createMockCantonAccount();
    const signedTx = JSON.stringify({
      serialized: "garbage-serialized",
      signature: "garbage-sig__PARTY__fake-party-id",
    });

    await expect(
      broadcast(createMockContext(cantonDefaults.canton_network_devnet), {
        account,
        signedOperation: {
          signature: signedTx,
          operation: { id: "integ", hash: "", extra: {} },
        },
      } as any),
    ).rejects.toThrow(/Invalid value for: path parameter party_id/);
  });
});
