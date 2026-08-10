import { getChainAdapter } from "../../registry";

// Load the zcash adapter (side-effect registration)
import "../index";

// ── Adapter surface ─────────────────────────────────────────────────────
//
// The shielded/PCZT path lives entirely in `@ledgerhq/coin-zcash` now. This
// adapter only overrides the transparent-signer machinery
// (getAddress/getWalletXpub/getFullViewingKey/createSigner, exercised in
// index.test.ts) and the ZIP-317 fee resolution (transparent-fee-rate.test.ts).
// Every other `ChainAdapter` hook is intentionally absent so the generic
// Bitcoin bridge handles sync, balance, signing and status for every Zcash
// send unconditionally — there is no feature flag branching left to test.
describe("zcash chain adapter — reduced surface", () => {
  const adapter = getChainAdapter("zcash");

  it("registers itself under the 'zcash' currency id", () => {
    expect(adapter.id).toBe("zcash");
  });

  it("does not override sync/balance/transaction-details hooks (legacy Bitcoin path handles them)", () => {
    expect(adapter.buildExtraSyncObservable).toBeUndefined();
    expect(adapter.computeAccountBalance).toBeUndefined();
    expect(adapter.resolveTransactionDetails).toBeUndefined();
    expect(adapter.assignToAccountRaw).toBeUndefined();
    expect(adapter.assignFromAccountRaw).toBeUndefined();
  });

  it("does not override signing/status/broadcast hooks (legacy Bitcoin PSBT path handles them)", () => {
    expect(adapter.signOperation).toBeUndefined();
    expect(adapter.broadcast).toBeUndefined();
    expect(adapter.getTransactionStatus).toBeUndefined();
    expect(adapter.estimateMaxSpendable).toBeUndefined();
    expect(adapter.prepareTransaction).toBeUndefined();
  });
});
