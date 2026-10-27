import { configureStore } from "@reduxjs/toolkit";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { portfolioApi, portfolioApiExtra } from "@shared/api-services";
import type { BalanceEntry, BalanceGroup, Portfolio } from "./types";

export const PORTFOLIO_TEST_URL = "https://portfolio.test";

/** An xpub of the shape the service accepts. */
export const MOCK_XPUB = "x".repeat(111);
export const MOCK_EVM_ADDRESS = `0x${"ab".repeat(20)}`;
export const MOCK_EVM_PATH = "m/44h/60h/0h/0/0";

export const mockAddressDescriptor = (
  network = "ethereum",
  address = MOCK_EVM_ADDRESS,
  path = MOCK_EVM_PATH,
): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network,
  address,
  path,
});

export const mockUtxoDescriptor = (
  xpub = MOCK_XPUB,
  network = "bitcoin",
  path = "m/84h/0h/0h",
): AccountDescriptor => ({ purpose: "account", version: "2", type: "utxo", network, xpub, path });

/** An MSW route answered by a `jest.fn()` the test configures and asserts on. */
export type PortfolioEndpoint = jest.Mock<Response | Promise<Response>, [{ request: Request }]>;

export const portfolioUrl = (portfolioId: string, base = PORTFOLIO_TEST_URL) =>
  `${base}/v1/portfolio/${encodeURIComponent(portfolioId)}`;
export const registrationsUrl = (portfolioId: string, base = PORTFOLIO_TEST_URL) =>
  `${portfolioUrl(portfolioId, base)}/registrations`;
export const balanceUrl = (portfolioId: string, base = PORTFOLIO_TEST_URL) =>
  `${portfolioUrl(portfolioId, base)}/balance`;

export const mockPortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  id: "p1",
  registrations: [],
  accounts: [],
  ...overrides,
});

export const mockBalanceEntry = (overrides: Partial<BalanceEntry> = {}): BalanceEntry => ({
  network: "ethereum",
  account_id: "acc-eth",
  asset: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  decimals: 18,
  amount: "1000000000000000000",
  currency_value: 3000,
  estimated: false,
  status: "confirmed",
  locked: false,
  ...overrides,
});

export const mockBalanceGroup = (
  accountId: string,
  items: BalanceEntry[] = [mockBalanceEntry({ account_id: accountId })],
): BalanceGroup => ({
  type: "success",
  network: items[0]?.network ?? "ethereum",
  account_id: accountId,
  items,
});

/** The smallest store the Portfolio endpoints run in. */
export const makePortfolioStore = (portfolioServiceUrl = PORTFOLIO_TEST_URL) =>
  configureStore({
    reducer: { [portfolioApi.reducerPath]: portfolioApi.reducer },
    middleware: gdm =>
      gdm({ thunk: { extraArgument: portfolioApiExtra({ portfolioServiceUrl }) } }).concat(
        portfolioApi.middleware,
      ),
  });
