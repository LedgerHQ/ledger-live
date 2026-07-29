/**
 * The two Zcash implementations must agree on what a persisted account is.
 *
 * `zcashShielded` routes Zcash to either the chain adapter inside
 * `@ledgerhq/coin-bitcoin` or the standalone `@ledgerhq/coin-zcash` (see
 * bridge/impl.ts). An account synced under one is read back by the other the
 * moment the flag moves -- forward on rollout, backward on rollback -- and
 * `family` is not persisted, so nothing at load time says which module wrote it.
 * A disagreement here does not fail loudly: it silently drops UTXOs or shielded
 * notes from a stored account, i.e. funds vanish from the balance.
 *
 * Each module is therefore checked against the other's real output rather than
 * against a fixture of what we believe it produces. This lives in live-common
 * because it is the only package that depends on both.
 */

import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import * as bitcoin from "@ledgerhq/coin-bitcoin/serialization";
import * as zcash from "@ledgerhq/coin-zcash/bridge/serialization";

// coin-bitcoin only knows about Zcash once its chain adapter has registered
// itself, which the adapter module does on load -- in the app, through
// coin-bitcoin's own config.ts. Without this the registry hands back the default
// adapter, which persists no shielded state, and the comparison below would pass
// for the wrong reason.
import "@ledgerhq/coin-bitcoin/chain-adapters/zcash/index";

const ADDRESS = "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F";
const currency = getCryptoCurrencyById("zcash");

/** An account as a sync leaves it: transparent UTXOs and shielded scan state. */
function syncedAccount(): Account {
  return {
    id: "js:2:zcash:xpub6D:",
    currency,
    bitcoinResources: {
      utxos: [
        {
          hash: "aa".repeat(32),
          outputIndex: 0,
          blockHeight: 3_425_800,
          address: ADDRESS,
          value: new BigNumber(100_000),
          rbf: false,
          isChange: false,
        },
        {
          hash: "bb".repeat(32),
          outputIndex: 1,
          blockHeight: 3_425_861,
          address: ADDRESS,
          value: new BigNumber(25_000),
          rbf: false,
          isChange: true,
        },
      ],
    },
    privateInfo: {
      orchardBalance: new BigNumber(5_000),
      saplingBalance: new BigNumber(0),
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "uview1key",
      birthday: "2022-05-31",
      lastSyncTimestamp: 1_700_000_000_000,
      lastProcessedBlock: 3_425_862,
      transactions: [
        {
          id: "932c99c7",
          hex: "00",
          blockHeight: 3_425_862,
          blockHash: "cc".repeat(32),
          timestamp: 1_700_000_000,
          fee: new BigNumber(15_000),
          // The transparent bundle of a shielded→transparent send, which the
          // accounting needs to tell apart from a self-transfer.
          transparentOut: new BigNumber(500_000),
          hasTransparentInputs: false,
          decryptedData: {
            orchard_outputs: [
              {
                amount: new BigNumber(5_000),
                transfer_type: "incoming",
                memo: "",
                nullifier: "dd".repeat(32),
                rho: "ee".repeat(32),
                rseed: "ff".repeat(32),
                cmx: "11".repeat(32),
                position: "42",
                recipient: "22".repeat(43),
                isSpent: false,
              },
            ],
            sapling_outputs: [],
          },
        },
      ],
    },
  } as unknown as Account;
}

/** The account-level fields both modules leave untouched. */
const baseRaw = (): AccountRaw =>
  ({
    id: "js:2:zcash:xpub6D:",
    currencyId: "zcash",
    freshAddress: ADDRESS,
    balance: "630000",
  }) as unknown as AccountRaw;

const emptyAccount = (): Account => ({ id: "js:2:zcash:xpub6D:", currency }) as unknown as Account;

const writtenBy = (module: typeof bitcoin | typeof zcash): AccountRaw => {
  const raw = baseRaw();
  module.assignToAccountRaw(syncedAccount(), raw);
  return raw;
};

const readBy = (module: typeof bitcoin | typeof zcash, raw: AccountRaw): Account => {
  const account = emptyAccount();
  module.assignFromAccountRaw(raw, account);
  return account;
};

describe("zcash account serialization, coin-bitcoin vs coin-zcash", () => {
  it("persists the same account raw", () => {
    expect(writtenBy(zcash)).toEqual(writtenBy(bitcoin));
  });

  it("reads back an account persisted by coin-bitcoin identically", () => {
    const persisted = writtenBy(bitcoin);

    expect(readBy(zcash, persisted)).toEqual(readBy(bitcoin, persisted));
  });

  it("reads back an account persisted by coin-zcash identically", () => {
    const persisted = writtenBy(zcash);

    expect(readBy(bitcoin, persisted)).toEqual(readBy(zcash, persisted));
  });

  it("survives a round trip through either module, in both directions", () => {
    // What a rollout then a rollback does to the same account.
    const throughZcash = writtenBy(zcash);
    const reloaded = readBy(bitcoin, throughZcash);
    const rewritten = baseRaw();
    bitcoin.assignToAccountRaw(reloaded, rewritten);

    expect(rewritten).toEqual(throughZcash);
  });

  it("leaves an account with no Zcash data alone, the same way", () => {
    const bare = baseRaw();

    expect(readBy(zcash, bare)).toEqual(readBy(bitcoin, bare));
  });
});
