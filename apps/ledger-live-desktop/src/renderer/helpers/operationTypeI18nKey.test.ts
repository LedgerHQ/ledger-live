import i18n from "~/renderer/i18n/init";
import { getOperationTypeI18nKey } from "./operationTypeI18nKey";

describe("getOperationTypeI18nKey", () => {
  it("prefers the family-scoped key, then falls back to the shared key", () => {
    expect(getOperationTypeI18nKey("UNSTAKE", "tezos")).toEqual([
      "tezos.operationTypes.UNSTAKE",
      "operation.type.UNSTAKE",
    ]);
  });

  it("builds the same fallback shape for any family, so families without an override resolve the shared label", () => {
    expect(getOperationTypeI18nKey("UNSTAKE", "aptos")).toEqual([
      "aptos.operationTypes.UNSTAKE",
      "operation.type.UNSTAKE",
    ]);
  });

  it("returns the shared key directly when no family is provided", () => {
    expect(getOperationTypeI18nKey("IN")).toBe("operation.type.IN");
  });

  it("resolves aleo's WITHDRAW_UNBONDED to the family-scoped 'Claim' label via the real translations, not the shared 'Withdrawal' fallback", () => {
    expect(i18n.t(getOperationTypeI18nKey("WITHDRAW_UNBONDED", "aleo"))).toBe("Claim");
  });
});
