import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { fromAccountRaw, toAccountRaw } from "../../account/serialization";
import type { XrpTokenAccount, XrpTokenAccountRaw, XrpTokenResources } from "./types";

const rippleTestnet = getCryptoCurrencyById("ripple_testnet");

function makeToken(tokenType: string, tokenIdentifier: string) {
  return {
    tokenType,
    tokenIdentifier,
    type: "TokenCurrency",
    id: `ripple_testnet/${tokenType}/${tokenIdentifier}`,
    parentCurrencyId: "ripple_testnet",
    parentCurrency: rippleTestnet,
    contractAddress: "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV",
    name: tokenIdentifier,
    ticker: tokenIdentifier,
    units: [
      {
        name: tokenIdentifier,
        code: tokenIdentifier,
        magnitude: 0,
      },
    ],
  } as unknown as TokenCurrency;
}

const usd = makeToken("iou", "USD");
const mpt = makeToken("mpt", "01489A324ABE1D127FB71A25754C935239D13C95BC8068E2");
const eur = makeToken("iou", "EUR");

setCryptoAssetsStore({
  findTokenById: async (id: string) => [usd, mpt, eur].find(token => token.id === id),
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "0",
} as unknown as CryptoAssetsStore);

async function roundTripTokenAccounts(resources: (XrpTokenResources | undefined)[]) {
  const account = genAccount("xrp-raw", { currency: rippleTestnet });
  // A `mock:` id would serialize through the mock bridge
  account.id = "js:2:ripple_testnet:rHolder:";
  account.subAccounts = [usd, mpt, eur].map((token, index) => {
    return { ...genTokenAccount(index, account, token), xrpResources: resources[index] };
  });

  const raw = await toAccountRaw(account);
  const revived = await fromAccountRaw(JSON.parse(JSON.stringify(raw)));

  return {
    raw: (raw.subAccounts ?? []) as XrpTokenAccountRaw[],
    revived: (revived.subAccounts ?? []) as XrpTokenAccount[],
  };
}

describe("xrp accountRawAssign", () => {
  it("keeps each token account's state through a raw round trip", async () => {
    const limit = new BigNumber("1e47");

    const tokenAccounts = await roundTripTokenAccounts([
      { limit, isLocked: true, isRippling: true },
      { isLocked: false },
      undefined,
    ]);

    expect(tokenAccounts.raw[0].xrpResources).toEqual({
      isLocked: true,
      limit: limit.toFixed(),
      isRippling: true,
    });
    expect(tokenAccounts.revived[0].xrpResources).toMatchObject({
      isLocked: true,
      isRippling: true,
    });
    expect(tokenAccounts.revived[0].xrpResources?.limit?.isEqualTo(limit)).toBe(true);
    expect(tokenAccounts.revived[1].xrpResources).toEqual({ isLocked: false });
    expect(tokenAccounts.raw[2]).not.toHaveProperty("xrpResources");
    expect(tokenAccounts.revived[2]).not.toHaveProperty("xrpResources");
  });
});
