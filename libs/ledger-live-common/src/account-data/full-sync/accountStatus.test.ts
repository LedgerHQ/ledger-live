import type { Account } from "@ledgerhq/types-live";
import type { CantonAccount } from "@ledgerhq/coin-canton/types";
import type { ConcordiumAccount } from "@ledgerhq/coin-concordium/types";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { toAccountStatus } from "./accountStatus";

registerAllCoins();

const findTokenById = jest.fn(async () => undefined);
setCryptoAssetsStore({
  findTokenById,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const accountOf = (currencyId: string, fields: Partial<Account> = {}): Account => ({
  ...genAccount(currencyId, { currency: getCryptoCurrencyById("ethereum") }),
  currency: getCryptoCurrencyById(currencyId),
  used: true,
  ...fields,
});

const emptyFields = {
  used: false,
  operationsCount: 0,
  balance: new BigNumber(0),
  subAccounts: [],
} satisfies Partial<Account>;

const canton = (isOnboarded: boolean, xpub?: string): CantonAccount => ({
  ...accountOf("canton_network", { ...emptyFields, xpub }),
  cantonResources: { isOnboarded, instrumentUtxoCounts: {}, pendingTransferProposals: [] },
});

const concordium = (isOnboarded: boolean): ConcordiumAccount => ({
  ...accountOf("concordium", emptyFields),
  concordiumResources: {
    isOnboarded,
    credId: "c",
    publicKey: "p",
    identityIndex: 0,
    credNumber: 0,
    ipIdentity: 0,
  },
});

const ready = { used: true, gate: null };
const onboarding = { type: "onboarding" };

describe("toAccountStatus", () => {
  it("never resolves a token", async () => {
    await toAccountStatus(accountOf("hedera"));
    expect(findTokenById).not.toHaveBeenCalled();
  });

  it("tells an account the scan found used, as Account.used", async () => {
    await expect(
      toAccountStatus(accountOf("ethereum", { ...emptyFields, used: true })),
    ).resolves.toEqual(ready);
  });

  it("tells an account scan found unused does not exist, as Account.used", async () => {
    await expect(toAccountStatus(accountOf("tron", emptyFields))).resolves.toEqual({
      ...ready,
      used: false,
    });
  });

  it.each([{ ready: false, reason: "unrevealed" }, { ready: false }, { ready: true }, undefined])(
    "does not gate a Tezos account whose sync readiness is %o: a send reveals it",
    async readiness => {
      await expect(toAccountStatus(accountOf("tezos", { readiness }))).resolves.toEqual(ready);
    },
  );

  it("requires the onboarding of a Canton account not onboarded", async () => {
    await expect(toAccountStatus(canton(false))).resolves.toEqual({
      used: false,
      gate: onboarding,
    });
  });

  it("does not gate an onboarded Canton account", async () => {
    await expect(toAccountStatus(canton(true))).resolves.toEqual({
      used: false,
      gate: null,
    });
  });

  it("requires the onboarding of a Concordium account not onboarded", async () => {
    await expect(toAccountStatus(concordium(false))).resolves.toEqual({
      used: false,
      gate: onboarding,
    });
  });

  it.each(["canton_network", "concordium"])(
    "does not gate a %s account persisted without its resources, as the onboard flows skip it",
    async currencyId => {
      await expect(toAccountStatus(accountOf(currencyId, emptyFields))).resolves.toEqual({
        used: false,
        gate: null,
      });
    },
  );

  it("does not gate an onboarded Concordium account", async () => {
    await expect(toAccountStatus(concordium(true))).resolves.toEqual({
      used: false,
      gate: null,
    });
  });

  it("counts a VeChain account holding only an empty VTHO as not existing, as its scan does", async () => {
    const vtho = { ...createFixtureTokenAccount("01"), balance: new BigNumber(0) };
    const vechain = (fields: Partial<Account>) =>
      accountOf("vechain", { ...emptyFields, used: true, subAccounts: [vtho], ...fields });
    await expect(toAccountStatus(vechain({}))).resolves.toEqual({
      used: false,
      gate: null,
    });
    await expect(toAccountStatus(vechain({ operationsCount: 1 }))).resolves.toEqual(ready);
    await expect(
      toAccountStatus(vechain({ subAccounts: [{ ...vtho, balance: new BigNumber(1) }] })),
    ).resolves.toEqual(ready);
  });

  it("counts a Kaspa account as used once it has an operation, as its scan does, not on a balance alone", async () => {
    const kaspa = (fields: Partial<Account>) =>
      accountOf("kaspa", { ...emptyFields, used: true, operations: [], ...fields });
    await expect(toAccountStatus(kaspa({ balance: new BigNumber(1) }))).resolves.toEqual({
      used: false,
      gate: null,
    });
    const [operation] = genAccount("kaspa-op", { operationsSize: 1 }).operations;
    await expect(toAccountStatus(kaspa({ operations: [operation] }))).resolves.toEqual(ready);
  });

  it.each(["hedera", "ripple", "stellar"])(
    "applies the default to a %s account",
    async currencyId => {
      await expect(toAccountStatus(accountOf(currencyId, emptyFields))).resolves.toEqual({
        used: false,
        gate: null,
      });
    },
  );
});
