import { act, renderHook } from "tests/testSetup";
import { useSwapNavigation } from "../useSwapNavigation";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { server } from "tests/server";
import { http, HttpResponse } from "msw";
import { DADA_API, EMPTY_DADA_RESPONSE } from "./shared";

const mockNavigate = jest.fn();
const mockOpenAssetAndAccount = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/market" }),
}));

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetAndAccount", () => ({
  useOpenAssetAndAccount: () => ({ openAssetAndAccount: mockOpenAssetAndAccount }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");

function serveAssetGroups(assetGroups: Record<string, Record<string, string>>) {
  const requests: URL[] = [];
  server.use(
    http.get(DADA_API, ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const pageSize = Number(url.searchParams.get("pageSize"));
      const pageGroups = Object.entries(assetGroups).slice(0, pageSize);
      return HttpResponse.json({
        ...EMPTY_DADA_RESPONSE,
        cryptoAssets: Object.fromEntries(
          pageGroups.map(([groupId, assetsIds]) => [
            groupId,
            { id: groupId, ticker: groupId, name: groupId, assetsIds },
          ]),
        ),
        currenciesOrder: {
          ...EMPTY_DADA_RESPONSE.currenciesOrder,
          metaCurrencyIds: pageGroups.map(([groupId]) => groupId),
        },
      });
    }),
  );
  return requests;
}

function createBitcoinAccount(id: string): Account {
  const account = genAccount(id, { currency: bitcoin });
  return { ...account, id };
}

describe("useSwapNavigation (Market actions)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should navigate to swap with defaultAccountId when one account exists for currency", async () => {
    const account = createBitcoinAccount("account-1");
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [account] },
    });

    await act(async () => {
      await result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultCurrency: { toCurrencyId: bitcoin.id },
        from: "/market",
        defaultAccountId: account.id,
        defaultAmountFrom: "0",
      }),
    });
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should navigate to swap with tokenId and defaultAccountId when one account exists for token", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const ethAccount = genAccount("eth-1", { currency: ethereum });
    const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);
    ethAccount.subAccounts = [tokenAccount];

    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [ethAccount] },
    });

    await act(async () => {
      await result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const callState = mockNavigate.mock.calls[0][1].state;
    expect(callState.defaultAccountId).toBe(tokenAccount.id);
    expect(callState.defaultParentAccountId).toBe(ethAccount.id);
    expect(callState.defaultCurrency).toEqual({ toCurrencyId: usdcToken.id });
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should navigate to swap webview with toTokenId only when no account exists for token", async () => {
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    await act(async () => {
      await result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultCurrency: { toCurrencyId: usdcToken.id },
        from: "/market",
        defaultToken: { toTokenId: usdcToken.id },
        defaultAmountFrom: "0",
      }),
    });
    expect(mockNavigate.mock.calls[0][1].state.defaultAccountId).toBeUndefined();
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should navigate to swap webview with defaultCurrency only when no account exists for crypto currency", async () => {
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    await act(async () => {
      await result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultCurrency: { toCurrencyId: bitcoin.id },
        from: "/market",
        defaultAmountFrom: "0",
      }),
    });
    expect(mockNavigate.mock.calls[0][1].state.defaultToken).toBeUndefined();
    expect(mockNavigate.mock.calls[0][1].state.defaultAccountId).toBeUndefined();
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should auto-select and navigate when only one account exists for currency", async () => {
    const account = createBitcoinAccount("single-btc");
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [account] },
    });

    await act(async () => {
      await result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultAccountId: account.id,
        defaultCurrency: { toCurrencyId: bitcoin.id },
      }),
    });
    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
  });

  test("should open drawer for account selection when more than one account exists for currency", async () => {
    const account1 = createBitcoinAccount("btc-1");
    const account2 = createBitcoinAccount("btc-2");
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [account1, account2] },
    });

    await act(async () => {
      await result.current.navigateToSwap(bitcoin as CryptoOrTokenCurrency, { source: "Asset" });
    });

    expect(mockOpenAssetAndAccount).toHaveBeenCalledTimes(1);
    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: [bitcoin.id],
        areCurrenciesFiltered: true,
        useCase: "swap",
        flow: "swap",
        source: "Asset",
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("should open the network and account drawer for a multi-network asset without accounts", async () => {
    const usdcOnSolana = "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v";
    const ledgerIds = [usdcToken.id, usdcOnSolana, "arc"];
    const requests = serveAssetGroups({
      "urn:crypto:meta-currency:usd_coin": { ethereum: usdcToken.id, solana: usdcOnSolana },
      "urn:crypto:meta-currency:arc_native_usdc": { arc: "arc" },
    });
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    await act(async () => {
      await result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency, { ledgerIds });
    });

    expect(requests[0].searchParams.get("transaction")).toBe("swap");
    expect(requests[0].searchParams.getAll("currencyIds").join(",")).toBe(ledgerIds.join(","));
    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({ currencies: [usdcToken.id, usdcOnSolana], useCase: "swap" }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("should open the drawer on the asset group of the currency when it is not the first group", async () => {
    const usdcOnSolana = "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v";
    serveAssetGroups({
      "urn:crypto:meta-currency:arc_native_usdc": { arc: "arc" },
      "urn:crypto:meta-currency:usd_coin": { ethereum: usdcToken.id, solana: usdcOnSolana },
    });
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    await act(async () => {
      await result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency, {
        ledgerIds: [usdcToken.id, usdcOnSolana, "arc"],
      });
    });

    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({ currencies: [usdcToken.id, usdcOnSolana] }),
    );
  });

  test("should open the drawer when the only swappable network is not the currency", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    serveAssetGroups({ ethereum: { base: "base" } });
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    await act(async () => {
      await result.current.navigateToSwap(ethereum, { ledgerIds: [ethereum.id, "base"] });
    });

    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({ currencies: ["base"] }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("should swap to the network of the account picked in the drawer", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const base = getCryptoCurrencyById("base");
    const baseAccount = genAccount("base-1", { currency: base });
    serveAssetGroups({ ethereum: { ethereum: ethereum.id, base: base.id } });
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [baseAccount] },
    });

    await act(async () => {
      await result.current.navigateToSwap(ethereum, { ledgerIds: [ethereum.id, base.id] });
    });
    const { onSuccess } = mockOpenAssetAndAccount.mock.calls[0][0];
    onSuccess(baseAccount);

    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({
        defaultCurrency: { toCurrencyId: base.id },
        defaultAccountId: baseAccount.id,
      }),
    });
  });

  test("should fall back to the single currency when the asset data request fails", async () => {
    server.use(http.get(DADA_API, () => HttpResponse.json({}, { status: 500 })));
    const { result } = renderHook(() => useSwapNavigation(), {
      initialState: { accounts: [] },
    });

    await act(async () => {
      await result.current.navigateToSwap(usdcToken as CryptoOrTokenCurrency, {
        ledgerIds: [usdcToken.id, "arc"],
      });
    });

    expect(mockOpenAssetAndAccount).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/swap", {
      state: expect.objectContaining({ defaultCurrency: { toCurrencyId: usdcToken.id } }),
    });
  });
});
