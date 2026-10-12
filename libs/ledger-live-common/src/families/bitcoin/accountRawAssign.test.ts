const migrated = { version: 1, syncedHeight: 90, anchor: null, addresses: [], confirmedUtxos: [] };
const migrateWalletAccount = jest.fn((..._args: unknown[]) => migrated);
jest.mock("./accountLayer/state", () => ({
  ...jest.requireActual("./accountLayer/state"),
  migrateWalletAccount: (...args: unknown[]) => migrateWalletAccount(...args),
}));

import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { emptyAccountState } from "./accountLayer/state";
import accountRawAssign from "./accountRawAssign";
import { fromBitcoinOutputRaw, toBitcoinOutputRaw } from "./serialization";
import type { BitcoinAccount, BitcoinAccountRaw, BitcoinOutput } from "./types";

const utxo: BitcoinOutput = {
  hash: "h",
  outputIndex: 1,
  blockHeight: 100,
  address: "bc1qme",
  value: new BigNumber(5_000),
  rbf: true,
  isChange: false,
};

beforeEach(() => jest.clearAllMocks());

describe("output codec", () => {
  it("round-trips an output", () => {
    expect(toBitcoinOutputRaw(utxo)).toEqual(["h", 1, 100, "bc1qme", "5000", 1, 0]);
    expect(fromBitcoinOutputRaw(toBitcoinOutputRaw(utxo))).toEqual(utxo);
  });

  it("reads missing heights and addresses as undefined", () => {
    const pending = { ...utxo, blockHeight: null, address: null, rbf: false, isChange: true };
    expect(toBitcoinOutputRaw(pending)).toEqual(["h", 1, null, null, "5000", 0, 1]);
    expect(fromBitcoinOutputRaw(toBitcoinOutputRaw(pending))).toEqual({
      ...pending,
      blockHeight: undefined,
      address: undefined,
    });
  });
});

describe("assignToAccountRaw", () => {
  it("writes the UTXOs and the account state, never the legacy store", () => {
    const accountRaw = {} as AccountRaw;
    const accountState = emptyAccountState();
    accountRawAssign.assignToAccountRaw(
      {
        bitcoinResources: { utxos: [utxo], accountState, walletAccount: { legacy: true } },
      } as unknown as Account,
      accountRaw,
    );
    expect((accountRaw as BitcoinAccountRaw).bitcoinResources).toEqual({
      utxos: [toBitcoinOutputRaw(utxo)],
      accountState,
    });

    accountRawAssign.assignToAccountRaw(
      { bitcoinResources: { utxos: [] } } as unknown as Account,
      accountRaw,
    );
    expect((accountRaw as BitcoinAccountRaw).bitcoinResources).toEqual({ utxos: [] });
  });

  it("leaves an account without resources alone", () => {
    const accountRaw = {} as AccountRaw;
    accountRawAssign.assignToAccountRaw({} as Account, accountRaw);
    expect(accountRaw).toEqual({});
  });
});

describe("assignFromAccountRaw", () => {
  const assign = (raw: Partial<BitcoinAccountRaw>) => {
    const account = {} as BitcoinAccount;
    accountRawAssign.assignFromAccountRaw(raw as AccountRaw, account);
    return account;
  };

  it("restores the UTXOs and a state of the current version", () => {
    const accountState = emptyAccountState();
    expect(
      assign({ bitcoinResources: { utxos: [toBitcoinOutputRaw(utxo)], accountState } })
        .bitcoinResources,
    ).toEqual({ utxos: [utxo], accountState });
    expect(migrateWalletAccount).not.toHaveBeenCalled();
  });

  it("builds the state of an account the legacy bridge persisted, at its last synced height", () => {
    const walletAccount = { legacy: true } as never;
    expect(
      assign({ blockHeight: 90, bitcoinResources: { utxos: [], walletAccount } }).bitcoinResources,
    ).toEqual({ utxos: [], accountState: migrated });
    expect(migrateWalletAccount).toHaveBeenCalledWith(walletAccount, 90);

    assign({
      bitcoinResources: { utxos: [], walletAccount, accountState: { version: 0 } as never },
    });
    expect(migrateWalletAccount).toHaveBeenLastCalledWith(walletAccount, 0);
  });

  it("restores no state when there is none to read", () => {
    expect(assign({ bitcoinResources: {} as never }).bitcoinResources).toEqual({ utxos: [] });
    expect(assign({})).toEqual({});
  });
});
