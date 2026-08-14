import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { getChainAdapter } from "../../registry";
import type { ZcashAccount, ZcashAccountRaw, ZcashPrivateInfo } from "../types";

// Load the zcash adapter (side-effect registration)
import "../index";

// ── Adapter surface ─────────────────────────────────────────────────────
//
// The shielded/PCZT path lives entirely in `@ledgerhq/coin-zcash` now. This
// adapter only overrides the transparent-signer machinery
// (getAddress/getWalletXpub/getFullViewingKey/createSigner, exercised in
// index.test.ts), the ZIP-317 fee resolution (transparent-fee-rate.test.ts)
// and the shielded `privateInfo` (de)serialization — kept because the bitcoin
// bridge reads Zcash accounts back at app startup, before the `zcashShielded`
// flag is mirrored, so nothing else would persist the ufvk.
describe("zcash chain adapter — reduced surface", () => {
  const adapter = getChainAdapter("zcash");

  it("registers itself under the 'zcash' currency id", () => {
    expect(adapter.id).toBe("zcash");
  });

  it("does not override sync/balance/transaction-details hooks (legacy Bitcoin path handles them)", () => {
    expect(adapter.buildExtraSyncObservable).toBeUndefined();
    expect(adapter.computeAccountBalance).toBeUndefined();
    expect(adapter.resolveTransactionDetails).toBeUndefined();
  });

  it("does not override signing/status/broadcast hooks (legacy Bitcoin PSBT path handles them)", () => {
    expect(adapter.signOperation).toBeUndefined();
    expect(adapter.broadcast).toBeUndefined();
    expect(adapter.getTransactionStatus).toBeUndefined();
    expect(adapter.estimateMaxSpendable).toBeUndefined();
    expect(adapter.prepareTransaction).toBeUndefined();
  });
});

// Regression guard: the ufvk (and the shielded balances/notes) must survive a
// persist → load round-trip through the bitcoin bridge, which is the family
// that serves Zcash accounts at startup decode. Before this the shielded state
// was dropped on load and then erased on the next save.
describe("zcash chain adapter — shielded privateInfo (de)serialization", () => {
  const adapter = getChainAdapter("zcash");

  const privateInfo: ZcashPrivateInfo = {
    saplingBalance: new BigNumber(0),
    orchardBalance: new BigNumber(1234),
    ironwoodBalance: new BigNumber(56),
    syncState: "ready",
    progress: 42,
    estimatedTimeRemaining: { hours: 0, minutes: 3 },
    ufvk: "uview-persisted",
    birthday: "2022-05-31",
    lastSyncTimestamp: 1_700_000_000_000,
    lastProcessedBlock: 3_400_000,
    transactions: [
      {
        id: "tx-1",
        hex: "deadbeef",
        blockHeight: 3_399_999,
        blockHash: "hash-1",
        timestamp: 1_699_999_999,
        fee: new BigNumber(1000),
        decryptedData: {
          orchard_outputs: [
            {
              memo: "",
              transfer_type: "incoming",
              amount: new BigNumber(1234),
              nullifier: "aa",
              isSpent: false,
            },
          ],
          sapling_outputs: [],
        },
      },
    ],
  };

  it("exposes the serialization hooks", () => {
    expect(typeof adapter.assignToAccountRaw).toBe("function");
    expect(typeof adapter.assignFromAccountRaw).toBe("function");
  });

  it("round-trips the ufvk, balances and notes through raw", () => {
    const account = { privateInfo } as unknown as ZcashAccount;
    const accountRaw = {} as AccountRaw;

    adapter.assignToAccountRaw!(account as unknown as Account, accountRaw);
    const raw = accountRaw as ZcashAccountRaw;
    expect(raw.privateInfo?.ufvk).toBe("uview-persisted");
    expect(raw.privateInfo?.orchardBalance).toBe("1234");

    const restoredAccount = {} as ZcashAccount;
    adapter.assignFromAccountRaw!(accountRaw, restoredAccount as unknown as Account);
    const restored = restoredAccount.privateInfo!;

    expect(restored.ufvk).toBe("uview-persisted");
    expect(restored.syncState).toBe("ready");
    expect(restored.orchardBalance.toString()).toBe("1234");
    expect(restored.ironwoodBalance.toString()).toBe("56");
    expect(restored.lastProcessedBlock).toBe(3_400_000);
    expect(restored.transactions[0].fee.toString()).toBe("1000");
    expect(restored.transactions[0].decryptedData?.orchard_outputs[0].amount.toString()).toBe(
      "1234",
    );
    expect(restored.transactions[0].decryptedData?.orchard_outputs[0].isSpent).toBe(false);
  });

  it("writes nothing when the account has no shielded state", () => {
    const accountRaw = {} as AccountRaw;
    adapter.assignToAccountRaw!({} as Account, accountRaw);
    expect((accountRaw as ZcashAccountRaw).privateInfo).toBeUndefined();
  });
});
