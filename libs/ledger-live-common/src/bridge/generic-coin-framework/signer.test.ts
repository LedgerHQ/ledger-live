import { getSigner } from "./signer";

describe("getSigner", () => {
  it("resolves a signer for hedera instead of throwing 'No signer registered'", async () => {
    const signer = await getSigner("hedera");

    expect(signer.getAddress).toBeInstanceOf(Function);
    expect(signer.context).toBeInstanceOf(Function);
  });

  it("still throws for a family with no registered signer", async () => {
    await expect(getSigner("not-a-real-family")).rejects.toThrow(
      "No signer registered for network not-a-real-family",
    );
  });
});
