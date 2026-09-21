import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ZcashAccount, ZcashAccountRaw } from "@ledgerhq/coin-zcash/types/bridge";
import { createTransaction } from "@ledgerhq/coin-zcash/bridge/createTransaction";
import { getTransactionStatus } from "@ledgerhq/coin-zcash/bridge/getTransactionStatus";
import zcashMockBridge from "./mock";

// The mock bridge wires the real coin-zcash bridge logic in directly (see
// mock.ts's header comment): this pins that wiring rather than re-testing
// business rules already covered by coin-zcash's own unit tests.
describe("zcash mock bridge", () => {
  const { accountBridge } = zcashMockBridge;

  it("reuses the real, network-free coin-zcash bridge functions rather than reimplementing them", () => {
    expect(accountBridge.createTransaction).toBe(createTransaction);
    expect(accountBridge.getTransactionStatus).toBe(getTransactionStatus);
  });

  it("round-trips bitcoinResources and privateInfo through assignFromAccountRaw/assignToAccountRaw", () => {
    // This is the exact regression the mock bridge fixes: without it,
    // getAccountBridgeByFamily("zcash", mockAccountId) fell through to the
    // real bridge for a "mock:" account id, so a fixture's privateInfo/
    // bitcoinResources never made it onto the live Account object.
    const raw: ZcashAccountRaw = {
      id: "mock:1:zcash:zcash_1:",
      seedIdentifier: "mock",
      derivationMode: "",
      index: 0,
      freshAddress: "t1transparent",
      freshAddressPath: "44'/133'/0'/0/0",
      freshAddresses: [],
      name: "Zcash 1",
      balance: "7000000",
      spendableBalance: "7000000",
      blockHeight: 3450000,
      currencyId: "zcash",
      unitMagnitude: 8,
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      lastSyncDate: "",
      creationDate: new Date().toISOString(),
      bitcoinResources: {
        utxos: [["aaaa", 0, 3449990, "t1transparent", "5000000", 0, 0]],
      },
      privateInfo: {
        saplingBalance: "0",
        orchardBalance: "0",
        ironwoodBalance: "2000000",
        syncState: "complete",
        progress: 1,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: "uview1test",
        birthday: null,
        shieldedAddress: "u1shielded",
        lastSyncTimestamp: 1700000000000,
        lastProcessedBlock: 3450000,
        transactions: [],
      },
    } as unknown as ZcashAccountRaw;

    const account = { id: raw.id, currency: { id: "zcash" } } as unknown as Account;
    accountBridge.assignFromAccountRaw?.(raw as AccountRaw, account);

    const zcashAccount = account as unknown as ZcashAccount;
    expect(zcashAccount.bitcoinResources?.utxos).toHaveLength(1);
    expect(zcashAccount.privateInfo?.ufvk).toBe("uview1test");
    expect(zcashAccount.privateInfo?.ironwoodBalance).toBeInstanceOf(BigNumber);

    const rawOut: AccountRaw = { id: raw.id } as AccountRaw;
    accountBridge.assignToAccountRaw?.(account, rawOut);
    expect((rawOut as ZcashAccountRaw).privateInfo?.ufvk).toBe("uview1test");
    expect((rawOut as ZcashAccountRaw).bitcoinResources?.utxos).toHaveLength(1);
  });

  it("exposes an estimation recipient so extensions that price a transaction before a recipient is typed don't throw", () => {
    expect(typeof accountBridge.getEstimationRecipient?.({} as Account)).toBe("string");
  });

  it("validates a Sapling address the same way the real bridge does (rejected, no Orchard fallback)", async () => {
    const isValid = await accountBridge.validateAddress(
      "zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slya",
      {},
    );
    expect(isValid).toBe(false);
  });

  it("createTransaction defaults to the transparent transfer type", () => {
    const tx = createTransaction({} as Account);
    expect(tx.family).toBe("zcash");
    expect(tx.transferType).toBe("transparent");
  });
});
