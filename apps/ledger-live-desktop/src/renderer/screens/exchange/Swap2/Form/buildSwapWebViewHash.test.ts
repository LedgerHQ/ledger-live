import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { buildSwapWebViewHash, type SwapLocationState } from "./buildSwapWebViewHash";
import type { SwapDefaultAccounts } from "./useSwapDefaultAccounts";

const ethereum = getCryptoCurrencyById("ethereum");
const ethAccount = genAccount("eth-1", { currency: ethereum });
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);

const NO_ACCOUNTS: SwapDefaultAccounts = {
  rawFromAccountId: undefined,
  rawToAccountId: undefined,
  resolvedDefaultFromAccount: undefined,
  resolvedDefaultFromParentAccount: undefined,
  resolvedDefaultToAccount: undefined,
  resolvedDefaultToParentAccount: undefined,
};

function build(state: SwapLocationState | null, defaultAccounts = NO_ACCOUNTS) {
  return new URLSearchParams(
    buildSwapWebViewHash({ state, defaultAccounts, accountNames: new Map(), isOffline: false }),
  );
}

describe("buildSwapWebViewHash", () => {
  it("returns an empty query for an empty state", () => {
    expect(
      buildSwapWebViewHash({
        state: null,
        defaultAccounts: NO_ACCOUNTS,
        accountNames: new Map(),
        isOffline: false,
      }),
    ).toBe("");
  });

  it("sends toTokenId and its legacy toToken alias for a token", () => {
    const params = build({
      defaultCurrency: { toCurrencyId: usdcToken.id },
      defaultToken: { toTokenId: usdcToken.id },
    });

    // The Earn live app sends all three, so a version reading any of them resolves the asset.
    expect(params.get("toTokenId")).toBe(usdcToken.id);
    expect(params.get("toToken")).toBe(usdcToken.id);
    expect(params.get("toCurrencyId")).toBe(usdcToken.id);
  });

  it("omits both token keys when no token is given", () => {
    const params = build({ defaultCurrency: { toCurrencyId: ethereum.id } });

    expect(params.get("toTokenId")).toBeNull();
    expect(params.get("toToken")).toBeNull();
    expect(params.get("toCurrencyId")).toBe(ethereum.id);
  });

  it("converts a resolved token account into a wallet-API id", () => {
    const params = build(
      { defaultAmountFrom: "0" },
      {
        ...NO_ACCOUNTS,
        resolvedDefaultToAccount: usdcAccount,
        resolvedDefaultToParentAccount: ethAccount,
      },
    );

    const toAccountId = params.get("toAccountId");
    expect(toAccountId).toBeTruthy();
    // A wallet-API id is a uuid, never the raw internal id the live app cannot match.
    expect(toAccountId).not.toBe(usdcAccount.id);
  });

  it("forwards a raw id untouched when the account could not be resolved", () => {
    const params = build({}, { ...NO_ACCOUNTS, rawToAccountId: "js:2:ethereum:0xdead:+0xbeef" });

    expect(params.get("toAccountId")).toBe("js:2:ethereum:0xdead:+0xbeef");
  });

  it("strips the account id out of the from path", () => {
    const params = build({ from: "/account/js:2:ethereum:0xdead:" });

    expect(params.get("fromPath")).toBe("/account/{id}");
  });

  it("flags an offline session", () => {
    expect(
      new URLSearchParams(
        buildSwapWebViewHash({
          state: null,
          defaultAccounts: NO_ACCOUNTS,
          accountNames: new Map(),
          isOffline: true,
        }),
      ).get("isOffline"),
    ).toBe("true");
  });

  it("passes the remaining deeplink parameters through", () => {
    const params = build({
      defaultCurrency: { fromCurrencyId: ethereum.id },
      defaultToken: { fromTokenId: usdcToken.id },
      defaultAmountFrom: "1.5",
      affiliate: "partner123",
    });

    expect(params.get("fromCurrencyId")).toBe(ethereum.id);
    expect(params.get("fromTokenId")).toBe(usdcToken.id);
    expect(params.get("amountFrom")).toBe("1.5");
    expect(params.get("affiliate")).toBe("partner123");
  });
});
