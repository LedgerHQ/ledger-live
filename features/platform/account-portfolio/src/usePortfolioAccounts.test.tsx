import React, { type ReactNode } from "react";
import { Provider } from "react-redux";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { portfolioApi } from "@shared/api-services";
import { setupServer } from "msw/node";
import {
  balanceUrl,
  makePortfolioStore,
  mockBalanceEntry,
  mockAddressDescriptor,
  mockBalanceGroup,
  MOCK_EVM_ADDRESS,
  mockPortfolio,
  portfolioUrl,
  registrationsUrl,
  type PortfolioEndpoint,
} from "@domain/api-account-portfolio/mock/portfolio-api";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import type { PortfolioWalletAccount } from "./portfolioAccounts";
import { usePortfolioAccounts, type UsePortfolioAccountsParams } from "./usePortfolioAccounts";

const SERVICE_ACCOUNT_ID = `ethereum:${MOCK_EVM_ADDRESS}`;
const descriptor = mockAddressDescriptor();
const walletAccounts: PortfolioWalletAccount[] = [
  { accountUUID: computeAccountUUID(descriptor), descriptor, addresses: [] },
];

const registered = (status: "uninitialized" | "synchronized") =>
  mockPortfolio({
    registrations: [{ id: "r1", type: "evm", address: MOCK_EVM_ADDRESS }],
    accounts: [{ id: SERVICE_ACCOUNT_ID, network: "ethereum", status }],
  });
const balance = (currencyValue: number) =>
  HttpResponse.json({
    items: [
      mockBalanceGroup(SERVICE_ACCOUNT_ID, [
        mockBalanceEntry({ account_id: SERVICE_ACCOUNT_ID, currency_value: currencyValue }),
      ]),
    ],
    nextToken: null,
  });

const endpoints = {
  read: jest.fn() as PortfolioEndpoint,
  add: jest.fn() as PortfolioEndpoint,
  balance: jest.fn() as PortfolioEndpoint,
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

beforeEach(() => {
  endpoints.read
    .mockReset()
    .mockImplementation(() => HttpResponse.json(registered("synchronized")));
  endpoints.add
    .mockReset()
    .mockImplementation(() => HttpResponse.json(registered("uninitialized")));
  endpoints.balance.mockReset().mockImplementation(() => balance(3000));
  server.resetHandlers(
    http.get(portfolioUrl("p1"), endpoints.read),
    http.post(registrationsUrl("p1"), endpoints.add),
    http.get(balanceUrl("p1"), endpoints.balance),
  );
});

const stores: ReturnType<typeof makePortfolioStore>[] = [];

afterEach(() => {
  cleanup();
  // Clears the cache-removal timers the unmounted subscriptions leave behind.
  for (const store of stores.splice(0)) store.dispatch(portfolioApi.util.resetApiState());
});

function setup(initialProps: Partial<UsePortfolioAccountsParams> = {}) {
  const store = makePortfolioStore();
  stores.push(store);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(
    (props: Partial<UsePortfolioAccountsParams>) =>
      usePortfolioAccounts({
        portfolioId: "p1",
        walletAccounts,
        currency: "USD",
        pollingInterval: 20,
        ...props,
      }),
    { wrapper, initialProps },
  );
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("usePortfolioAccounts", () => {
  it("should register the wallet accounts, then read their balances", async () => {
    endpoints.read.mockImplementationOnce(() => HttpResponse.json(mockPortfolio()));
    const { result } = setup();

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(await endpoints.add.mock.calls[0]?.[0].request.json()).toEqual([
      { type: "evm", address: MOCK_EVM_ADDRESS },
    ]);
    expect(result.current.total).toBe(3000);
    expect(result.current.accounts[0]?.accountUUID).toBe(walletAccounts[0]?.accountUUID);
  });

  it("should poll while the service indexes, and stop once synchronized", async () => {
    endpoints.read
      .mockImplementationOnce(() => HttpResponse.json(registered("uninitialized")))
      .mockImplementationOnce(() => HttpResponse.json(registered("uninitialized")))
      .mockImplementationOnce(() => HttpResponse.json(registered("uninitialized")));
    const { result } = setup();

    await waitFor(() => expect(result.current.syncing).toBe(true));
    await waitFor(() => expect(result.current.syncing).toBe(false));
    const reads = endpoints.read.mock.calls.length;
    await wait(100);

    expect(endpoints.read).toHaveBeenCalledTimes(reads);
    expect(result.current.accounts[0]?.status).toBe("synchronized");
  });

  it("should show no value of the previous currency while the new one loads", async () => {
    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.total).toBe(3000));
    endpoints.balance.mockImplementation(() => balance(2000));

    rerender({ currency: "EUR" });

    expect(result.current.total).toBeNull();
    expect(result.current.accounts).toEqual([]);
    await waitFor(() => expect(result.current.total).toBe(2000));
    expect(result.current.currency).toBe("EUR");
  });

  it("should report the failure of the current request", async () => {
    endpoints.balance.mockImplementation(() =>
      HttpResponse.json({ details: "not indexed" }, { status: 400 }),
    );
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.total).toBeNull();
  });

  it("should not call the service when skipped", async () => {
    const { result } = setup({ skip: true });
    await wait(50);

    expect(result.current.status).toBe("idle");
    expect(endpoints.read).not.toHaveBeenCalled();
  });

  it("should stop polling once unmounted", async () => {
    endpoints.read.mockImplementation(() => HttpResponse.json(registered("uninitialized")));
    const { result, unmount } = setup();
    await waitFor(() => expect(result.current.syncing).toBe(true));

    unmount();
    const reads = endpoints.read.mock.calls.length;
    await wait(100);

    expect(endpoints.read).toHaveBeenCalledTimes(reads);
  });
});
