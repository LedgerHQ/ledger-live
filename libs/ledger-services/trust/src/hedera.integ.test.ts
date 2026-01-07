import { getPublicKey } from "./hedera";

describe("getPublicKey", () => {
  it("returns expected public key info", async () => {
    // When
    const result = await getPublicKey("0.0.751515", "1", "test");

    // Then
    expect(result).toEqual(
      expect.objectContaining({
        account: "0.0.751515",
        key: "0xe645c093bab64b4d076e82a85fd11bbfac24af0d827e7dafa8c49e04395970eb",
      }),
    );
  });
});
