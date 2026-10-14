import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { emptyState, versioned } from "@ledgerhq/account-module-utxo";
import type { Operation } from "@ledgerhq/types-live";
import type { BitcoinAccount } from "../types";
import {
  bitcoinAccountData,
  conflictingTxIds,
  getNextChangeAddress,
  getOwnDisplayAddresses,
} from "./account";
import { cryptoFor } from "./derivation";

const XPUB =
  "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
const address = (chain: number, index: number) =>
  cryptoFor("bitcoin").getAddress("Legacy", XPUB, chain, index);

const pending = (hash: string, inputs: string[]) =>
  ({
    id: `pending-${hash}`,
    hash,
    type: "OUT",
    value: new BigNumber(1),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    accountId: "a",
    date: new Date(),
    extra: { inputs },
  }) as unknown as Operation;

async function bitcoinAccount(pendingOperations: Operation[] = []): Promise<BitcoinAccount> {
  return {
    id: `js:2:bitcoin:${XPUB}:`,
    currency: getCryptoCurrencyById("bitcoin"),
    derivationMode: "",
    index: 0,
    freshAddressPath: "44'/0'/0'/0/0",
    operations: [],
    pendingOperations,
    bitcoinResources: {
      utxos: [],
      accountState: versioned({
        ...emptyState(),
        addresses: [
          { address: await address(0, 0), chain: 0, index: 0 },
          { address: await address(1, 0), chain: 1, index: 0 },
        ],
      }),
    },
  } as unknown as BitcoinAccount;
}

describe("bitcoin account helpers", () => {
  it("describe the account to its module", async () => {
    const data = bitcoinAccountData(await bitcoinAccount());
    expect(data.descriptor).toEqual({
      currencyId: "bitcoin",
      derivationMode: "",
      index: 0,
      key: XPUB,
      derivationPath: "44'/0'/0'",
    });
    expect(data.state?.data.addresses).toHaveLength(2);
  });

  it("give the next change address, and the addresses of the account", async () => {
    const account = await bitcoinAccount();
    expect(await getNextChangeAddress(account)).toEqual({
      address: await address(1, 1),
      path: "44'/0'/0'/1/1",
    });
    expect(await getOwnDisplayAddresses(account)).toEqual(
      new Set([await address(0, 0), await address(1, 0)]),
    );
  });

  it("list the other pending sends spending the same outputs", async () => {
    const account = await bitcoinAccount([
      pending("replaced", ["a-0"]),
      pending("child", ["a-0"]),
      pending("unrelated", ["b-0"]),
    ]);
    expect(conflictingTxIds(account, "replaced", new Set(["a-0"]))).toEqual(["child"]);
  });
});
