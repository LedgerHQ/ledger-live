import { EnergyDelegationTimeoutError } from "./errors";

test("EnergyDelegationTimeoutError carries name and payment txid", () => {
  const err = new EnergyDelegationTimeoutError("timed out", { paymentTxId: "abc123" });
  expect(err.name).toBe("EnergyDelegationTimeoutError");
  expect((err as { paymentTxId?: string }).paymentTxId).toBe("abc123");
  expect(err).toBeInstanceOf(Error);
});
