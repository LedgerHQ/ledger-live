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

const ready = { exists: true, accountGate: null };
const onboarding = { type: "onboarding" };

describe("toAccountStatus", () => {
  it("never resolves a token", async () => {
    await toAccountStatus(accountOf("hedera"));
    expect(findTokenById).not.toHaveBeenCalled();
  });

  it("tells an account scan found used exists, as Account.used", async () => {
    await expect(
      toAccountStatus(accountOf("ethereum", { ...emptyFields, used: true })),
    ).resolves.toEqual(ready);
  });

  it("tells an account scan found unused does not exist, as Account.used", async () => {
    await expect(toAccountStatus(accountOf("tron", emptyFields))).resolves.toEqual({
      ...ready,
      exists: false,
    });
  });

  it("gates an account its sync found not ready, with the reason", async () => {
    await expect(
      toAccountStatus(accountOf("tezos", { readiness: { ready: false, reason: "unrevealed" } })),
    ).resolves.toEqual({ ...ready, accountGate: { type: "activation", reason: "unrevealed" } });
  });

  it("gates an account its sync found not ready, without a reason", async () => {
    await expect(
      toAccountStatus(accountOf("sei_evm", { readiness: { ready: false } })),
    ).resolves.toMatchObject({ accountGate: { type: "activation", reason: null } });
  });

  it.each([{ ready: true }, undefined])(
    "does not gate an account whose sync readiness is %o",
    async readiness => {
      await expect(toAccountStatus(accountOf("tezos", { readiness }))).resolves.toEqual(ready);
    },
  );

  it("requires the onboarding of a Canton account not onboarded", async () => {
    await expect(toAccountStatus(canton(false))).resolves.toEqual({
      exists: false,
      accountGate: onboarding,
    });
  });

  it("does not gate an onboarded Canton account", async () => {
    await expect(toAccountStatus(canton(true))).resolves.toEqual({
      exists: false,
      accountGate: null,
    });
  });

  it("requires the onboarding of a Concordium account not onboarded", async () => {
    await expect(toAccountStatus(concordium(false))).resolves.toEqual({
      exists: false,
      accountGate: onboarding,
    });
  });

  it.each(["canton_network", "concordium"])(
    "does not gate a %s account persisted without its resources, as the onboard flows skip it",
    async currencyId => {
      await expect(toAccountStatus(accountOf(currencyId, emptyFields))).resolves.toEqual({
        exists: false,
        accountGate: null,
      });
    },
  );

  it("does not gate an onboarded Concordium account", async () => {
    await expect(toAccountStatus(concordium(true))).resolves.toEqual({
      exists: false,
      accountGate: null,
    });
  });

  it("counts a VeChain account holding only an empty VTHO as not existing, as its scan does", async () => {
    const vtho = { ...createFixtureTokenAccount("01"), balance: new BigNumber(0) };
    const vechain = (fields: Partial<Account>) =>
      accountOf("vechain", { ...emptyFields, used: true, subAccounts: [vtho], ...fields });
    await expect(toAccountStatus(vechain({}))).resolves.toEqual({
      exists: false,
      accountGate: null,
    });
    await expect(toAccountStatus(vechain({ operationsCount: 1 }))).resolves.toEqual(ready);
    await expect(
      toAccountStatus(vechain({ subAccounts: [{ ...vtho, balance: new BigNumber(1) }] })),
    ).resolves.toEqual(ready);
  });

  it.each(["hedera", "ripple", "stellar"])(
    "applies the default to a %s account",
    async currencyId => {
      await expect(toAccountStatus(accountOf(currencyId, emptyFields))).resolves.toEqual({
        exists: false,
        accountGate: null,
      });
    },
  );
});
