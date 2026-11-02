import React from "react";
import { server } from "tests/server";
import { waitFor, render, cleanup } from "tests/testSetup";
import { mockMarket } from "tests/utils/assetDetailMocks";
import createStore from "~/state-manager/configureStore";
import { LiftSplashOnAppAvailability } from "../index";

const windowApi = {
  appDirname: "",
  appLoaded: jest.fn(),
  reloadRenderer: jest.fn(),
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

  it("should call appLoaded when the check reports geo-blocked", async () => {
    mockMarket.fail(451);
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should call appLoaded when the check fails open", async () => {
    mockMarket.networkError();
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should not call appLoaded while the availability check is pending", async () => {
    mockMarket.hang();
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });

    await expect(
      waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled(), { timeout: 300 }),
    ).rejects.toThrow();
  });

  it("should not throw if window.api is undefined", async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    window.api = undefined as never;

    const store = createStore({});
    expect(() => render(<LiftSplashOnAppAvailability />, { store })).not.toThrow();
  });
});
