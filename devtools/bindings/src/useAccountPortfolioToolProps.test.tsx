import React, { type PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountsSlice } from "@domain/entity-account";
import { useAccountPortfolioToolProps } from "./useAccountPortfolioToolProps";
import { RUNNERS } from "./portfolioActions/runners";

jest.mock("./portfolioActions/runners", () => ({ RUNNERS: { getPortfolio: jest.fn() } }));

const runner = RUNNERS.getPortfolio as unknown as jest.Mock;

function setup() {
  const store = configureStore({ reducer: { accountEntries: accountsSlice.reducer } });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useAccountPortfolioToolProps({ serviceUrl: "https://svc/" }), {
    wrapper,
  }).result.current;
}

const portfolioRequest = { action: "getPortfolio", portfolioId: "p", currency: "usd" } as const;

describe("useAccountPortfolioToolProps", () => {
  afterEach(() => runner.mockReset());

  it("hands the host's service url and a portfolio id that belongs to this session", () => {
    sessionStorage.clear();
    const props = setup();
    expect(props.serviceUrl).toBe("https://svc/");
    expect(props.defaultPortfolioId).toMatch(/^ledger-live-[0-9a-f-]{36}$/);
    expect(props.defaultPortfolioId).not.toBe("ledger-live-poc");
    expect(setup().defaultPortfolioId).toBe(props.defaultPortfolioId);
    expect(props.accounts).toEqual([]);
  });

  it("answers a successful run with what was sent and the view", async () => {
    runner.mockResolvedValue({
      body: { id: "p" },
      view: { kind: "portfolio", id: "p", registrations: 0, registrationEntries: [], accounts: [] },
    });
    const result = await setup().onRun(portfolioRequest);
    expect(result).toMatchObject({
      ok: true,
      currency: "usd",
      body: { id: "p" },
      view: { kind: "portfolio", id: "p" },
      sent: { method: "GET", url: "https://svc/v1/portfolio/p" },
    });
  });

  it("answers a body that is not JSON as a failure without calling the service", async () => {
    const result = await setup().onRun({
      action: "registerAccounts",
      portfolioId: "p",
      currency: "usd",
      registrationsJson: "{not json",
    });
    expect(result.ok).toBe(false);
    expect(result.body).toMatchObject({ name: "SyntaxError" });
    expect(runner).not.toHaveBeenCalled();
  });

  it("shows an Error a runner rejects with as a plain object", async () => {
    runner.mockRejectedValue(new Error("boom"));
    const result = await setup().onRun(portfolioRequest);
    expect(result).toMatchObject({ ok: false, body: { name: "Error", message: "boom" } });
  });

  it("passes what is not an Error through as it is", async () => {
    runner.mockRejectedValue({ status: 429 });
    const result = await setup().onRun(portfolioRequest);
    expect(result.body).toEqual({ status: 429 });
  });
});
