import React from "react";
import { AppAvailability, startCalHealthCheck } from "@features/flow-app-availability";
import { http, HttpResponse } from "msw";
import { server } from "tests/server";
import { screen, waitFor, render, cleanup } from "tests/testSetup";
import { mockMarket } from "tests/utils/assetDetailMocks";
import createStore from "~/state-manager/configureStore";
import { LiftSplashOnAppAvailability } from "../index";

const CAL_CURRENCIES = "*/v1/currencies";

function hangCal() {
  server.use(http.get(CAL_CURRENCIES, () => new Promise(() => {})));
}

const windowApi = {
  appDirname: "",
  appLoaded: jest.fn(),
  reloadRenderer: jest.fn(),
  openWindow: jest.fn(),
};

describe("LiftSplashOnAppAvailability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.api = windowApi;
  });

  afterEach(() => {
    cleanup();
    server.resetHandlers();
  });

  it("should call appLoaded when the availability check settles available", async () => {
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should call appLoaded without waiting when the CAL probe is already fulfilled", async () => {
    const store = createStore({});
    await startCalHealthCheck(store.dispatch);

    render(<LiftSplashOnAppAvailability />, { store });

    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should call appLoaded when the check reports geo-blocked", async () => {
    mockMarket.fail(451);
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should lift the splash onto the location screen when CAL hangs", async () => {
    mockMarket.fail(451);
    hangCal();
    const store = createStore({});
    render(
      <LiftSplashOnAppAvailability>
        <AppAvailability>
          <div>App</div>
        </AppAvailability>
      </LiftSplashOnAppAvailability>,
      { store },
    );

    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled(), { timeout: 4_000 });
    expect(screen.getByRole("heading", { name: "Location unavailable" })).toBeVisible();
    expect(screen.queryByText("App")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Ledger Wallet is currently unavailable" }),
    ).toBeNull();
  });

  it("should call appLoaded when the check fails open", async () => {
    mockMarket.networkError();
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should lift the splash onto the unavailable screen when CAL fails", async () => {
    server.use(http.get(CAL_CURRENCIES, () => new HttpResponse(null, { status: 503 })));
    const store = createStore({});
    render(
      <LiftSplashOnAppAvailability>
        <AppAvailability>
          <div>App</div>
        </AppAvailability>
      </LiftSplashOnAppAvailability>,
      { store },
    );

    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
    expect(
      screen.getByRole("heading", { name: "Ledger Wallet is currently unavailable" }),
    ).toBeVisible();
    expect(screen.queryByText("App")).toBeNull();
  });

  it("should not call appLoaded while the availability check is pending", async () => {
    mockMarket.hang();
    hangCal();
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });

    await expect(
      waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled(), { timeout: 300 }),
    ).rejects.toThrow("toHaveBeenCalled");
  });

  it("should not throw if window.api is undefined", async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    window.api = undefined as never;

    const store = createStore({});
    expect(() => render(<LiftSplashOnAppAvailability />, { store })).not.toThrow();
  });
});
