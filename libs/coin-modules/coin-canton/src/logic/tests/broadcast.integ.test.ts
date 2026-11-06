import { createMockContext } from "../../test/fixtures";
import { broadcast } from "../broadcast";

describe("Broadcast", () => {
  it("throws when submitting with an invalid party id", async () => {
    const signedTx = JSON.stringify({
      serialized: "garbage-serialized",
      signature: "garbage-sig__PARTY__fake-party-id",
    });

    await expect(broadcast(createMockContext(), signedTx)).rejects.toThrow(
      /Invalid value for: path parameter party_id/,
    );
  });
});
