import { validateEarnDepositScreen } from "../validation";

describe("validateEarnDepositScreen", () => {
  it("should validate the deposit screen", () => {
    const validated = validateEarnDepositScreen("cryptoAssetId", "accountId");
    expect(validated).toEqual({ cryptoAssetId: "cryptoAssetId", accountId: "accountId" });
  });

  it("should sanitize dangerous characters and protocols", () => {
    const validated = validateEarnDepositScreen(
      "  <script>alert(1)</script>btc  ",
      "  javascript:mystery  ",
    );
    expect(validated).toEqual({ cryptoAssetId: "btc", accountId: "mystery" });
  });

  it("should truncate values longer than 100 characters", () => {
    const long = "a".repeat(150);
    const validated = validateEarnDepositScreen(long, long);
    expect(validated.cryptoAssetId?.length).toBe(100);
    expect(validated.accountId?.length).toBe(100);
  });
});
