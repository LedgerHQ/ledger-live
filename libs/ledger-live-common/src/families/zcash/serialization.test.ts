/**
 * Zcash accounts saved before coin-zcash served them were written by coin-bitcoin.
 * coin-zcash must read them back without losing or rewriting anything users already
 * have on disk: the UTXOs, the wallet-btc account, the shielded state with its notes.
 * `persistedAccount` is that shape.
 */
import * as zcashSerialization from "@ledgerhq/coin-zcash/bridge/serialization";
import { toWalletBtcCurrency } from "@ledgerhq/coin-zcash/walletBtcCurrency";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import wallet, { DerivationModes } from "@ledgerhq/wallet-btc/index";

const zcash = getCryptoCurrencyById("zcash");

const serialization = {
  assignFromAccountRaw: zcashSerialization.makeAssignFromAccountRaw(jest.fn()),
  assignToAccountRaw: zcashSerialization.assignToAccountRaw,
};

async function persistedAccount(): Promise<AccountRaw> {
  const walletAccount = await wallet.generateAccount(
    {
      // BIP-32 test vector 1 master xpub: only held, never derived from here.
      xpub: "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8",
      path: "44'/133'",
      index: 0,
      currency: "zcash",
      network: "mainnet",
      derivationMode: DerivationModes.LEGACY,
    },
    toWalletBtcCurrency(zcash, { explorer: { url: "https://explorer.test.invalid" } }),
  );

  return {
    id: "js:2:zcash:xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8:",
    currencyId: "zcash",
    bitcoinResources: {
      utxos: [
        ["ab".repeat(32), 0, 3_400_000, "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8", "150000", 0, 0],
        // Unconfirmed: persisted with a null block height.
        ["cd".repeat(32), 1, null, "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F", "20000", 0, 1],
      ],
      walletAccount: wallet.exportToSerializedAccountSync(walletAccount),
    },
    privateInfo: {
      orchardBalance: "5000",
      saplingBalance: "0",
      ironwoodBalance: "70000",
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: "uview1test",
      birthday: "2026-01-01",
      shieldedAddress: "u1test",
      lastSyncTimestamp: 1_790_000_000,
      lastProcessedBlock: 3_500_000,
      lastSyncError: null,
      transactions: [
        {
          id: "ef".repeat(32),
          hex: "05000080",
          blockHeight: 3_450_000,
          blockHash: "01".repeat(32),
          timestamp: 1_789_000_000,
          fee: "15000",
          transparentOut: "0",
          hasTransparentInputs: true,
          decryptedData: {
            orchard_outputs: [],
            sapling_outputs: [],
            ironwood_outputs: [
              {
                memo: "",
                transfer_type: "incoming",
                amount: "70000",
                nullifier: "02".repeat(32),
                rho: "03".repeat(32),
                rseed: "04".repeat(32),
                cmx: "05".repeat(32),
                position: 42,
                recipient: "06".repeat(43),
                is_spent: false,
              },
            ],
          },
        },
      ],
    },
  } as unknown as AccountRaw;
}

type Serialization = {
  assignFromAccountRaw: (raw: AccountRaw, account: Account) => void;
  assignToAccountRaw: (account: Account, raw: AccountRaw) => void;
};

/** What `reader` restores from `raw`, written back by `writer`, as it would be stored. */
function readThenWrite(raw: AccountRaw, reader: Serialization, writer: Serialization): AccountRaw {
  const account = { id: raw.id, currency: zcash } as unknown as Account;
  reader.assignFromAccountRaw(raw, account);
  const out = { id: raw.id, currencyId: raw.currencyId } as unknown as AccountRaw;
  writer.assignToAccountRaw(account, out);
  return JSON.parse(JSON.stringify(out));
}

describe("Zcash account persistence", () => {
  it("reads what coin-bitcoin persisted and writes it back unchanged", async () => {
    const raw = await persistedAccount();

    expect(readThenWrite(raw, serialization, serialization)).toEqual(
      JSON.parse(JSON.stringify(raw)),
    );
  });
});
