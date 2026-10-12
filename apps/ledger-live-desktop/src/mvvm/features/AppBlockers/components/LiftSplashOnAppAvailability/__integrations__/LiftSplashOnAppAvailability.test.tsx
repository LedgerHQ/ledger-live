import React from "react";
import { getEnv } from "@shared/env";
import { server, HttpResponse, http } from "tests/server";
import { waitFor, render, cleanup } from "tests/testSetup";
import createStore from "~/state-manager/configureStore";
import { LiftSplashOnAppAvailability } from "../index";

const windowApi = {
  appDirname: "",
  appLoaded: jest.fn(),
  reloadRenderer: jest.fn(),
  openWindow: jest.fn(),
};

const OFAC_ENDPOINT = `${getEnv("LEDGER_COUNTERVALUES_API")}/v3/markets`;

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
    server.use(
      http.get(OFAC_ENDPOINT, () => {
        return HttpResponse.json({}, { status: 451 });
      }),
    );
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should call appLoaded when the check fails open", async () => {
    server.use(http.get(OFAC_ENDPOINT, () => HttpResponse.error()));
    const store = createStore({});
    render(<LiftSplashOnAppAvailability />, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("should not throw if window.api is undefined", async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    window.api = undefined as never;

    const store = createStore({});
    expect(() => render(<LiftSplashOnAppAvailability />, { store })).not.toThrow();
  });
});
