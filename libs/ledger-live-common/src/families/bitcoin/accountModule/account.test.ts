import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { emptyState, versioned } from "@ledgerhq/account-module-utxo";
import type { Operation } from "@ledgerhq/types-live";
import { isPortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { mockLiveConfig } from "../../../bridge/generic-coin-framework/tests/portfolioFixtures";
import type { BitcoinAccount } from "../types";
import {
  bitcoinAccountData,
  bitcoinWritePortfolioOf,
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
    expect((await data.state.get())?.data.addresses).toHaveLength(2);
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

describe("bitcoin account helpers through the portfolio layer", () => {
  const configure = (mode: "local" | "remote") =>
    mockLiveConfig({
      config_portfolio_service: { url: "", portfolioId: "wallet" },
      config_currency_bitcoin: { portfolio: { enabled: true, mode } },
    });

  afterEach(() => jest.restoreAllMocks());

  it("open no portfolio on the legacy path", async () => {
    mockLiveConfig({ config_currency_bitcoin: { status: { type: "active" } } });
    await expect(bitcoinWritePortfolioOf(await bitcoinAccount())).resolves.toBeNull();
  });

  it("read the account module of the local side, seeded from the account: the same addresses", async () => {
    configure("local");
    const account = await bitcoinAccount();

    const opened = await bitcoinWritePortfolioOf(account);

    expect(opened).toMatchObject({
      accountId: account.id,
      key: XPUB,
      network: "bitcoin",
      portfolioId: `wallet:${account.id}`,
    });
    expect(await getNextChangeAddress(account, opened)).toEqual({
      address: await address(1, 1),
      path: "44'/0'/0'/1/1",
    });
    // Opened on demand when the caller has not.
    expect(await getOwnDisplayAddresses(account)).toEqual(
      new Set([await address(0, 0), await address(1, 0)]),
    );
    expect(await getNextChangeAddress(account)).toEqual({
      address: await address(1, 1),
      path: "44'/0'/0'/1/1",
    });
  });

  it("fail explicitly where the service writes for the chain: no side holds the account", async () => {
    configure("remote");
    const account = await bitcoinAccount();
    const opened = await bitcoinWritePortfolioOf(account);

    const failures = await Promise.all([
      getNextChangeAddress(account, opened).catch(e => e),
      getOwnDisplayAddresses(account, opened).catch(e => e),
    ]);
    expect(failures.map(e => isPortfolioApiError(e) && e.type)).toEqual(["NOT_FOUND", "NOT_FOUND"]);
  });
});
