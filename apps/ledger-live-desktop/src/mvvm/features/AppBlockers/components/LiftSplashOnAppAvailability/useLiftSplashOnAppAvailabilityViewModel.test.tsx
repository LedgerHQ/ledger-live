import React from "react";
import { useAppAvailability, useCalCheck } from "@features/flow-app-availability";
import { I18nTestProvider } from "@shared/i18n/testing";
import { act, render, screen } from "@testing-library/react";
import { LiftSplashOnAppAvailability } from "./index";

jest.mock("@features/flow-app-availability", () => ({
  ...jest.requireActual("@features/flow-app-availability"),
  useAppAvailability: jest.fn(),
  useCalCheck: jest.fn(),
}));

const mockedUseAppAvailability = jest.mocked(useAppAvailability);
const mockedUseCalCheck = jest.mocked(useCalCheck);

const COPY = {
  en: {
    translation: {
      "serviceUnavailable.title": "Ledger Wallet is currently unavailable",
      "serviceUnavailable.description": "This does not impact your assets. Please try again later.",
    },
  },
};

const windowApi = {
  appDirname: "",
  appLoaded: jest.fn(),
  reloadRenderer: jest.fn(),
  openWindow: jest.fn(),
};

describe("useLiftSplashOnAppAvailabilityViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    window.api = windowApi;
    mockedUseAppAvailability.mockReturnValue({ status: "pending" });
    mockedUseCalCheck.mockReturnValue({ status: "pending" });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should keep the splash up while the CAL check is pending", () => {
    render(
      <I18nTestProvider resources={COPY}>
        <LiftSplashOnAppAvailability>
          <div>App</div>
        </LiftSplashOnAppAvailability>
      </I18nTestProvider>,
    );

    act(() => {
      jest.advanceTimersByTime(2_999);
    });

    expect(windowApi.appLoaded).not.toHaveBeenCalled();
    expect(screen.getByText("App")).toBeVisible();
  });

  it("should call appLoaded immediately when CAL is already available", () => {
    mockedUseAppAvailability.mockReturnValue({ status: "available" });
    mockedUseCalCheck.mockReturnValue({ status: "available" });

    render(
      <I18nTestProvider resources={COPY}>
        <LiftSplashOnAppAvailability>
          <div>App</div>
        </LiftSplashOnAppAvailability>
      </I18nTestProvider>,
    );

    expect(windowApi.appLoaded).toHaveBeenCalled();
    expect(screen.getByText("App")).toBeVisible();
  });

  it("should show the unavailable screen when the CAL check is still pending at the cap", () => {
    render(
      <I18nTestProvider resources={COPY}>
        <LiftSplashOnAppAvailability>
          <div>App</div>
        </LiftSplashOnAppAvailability>
      </I18nTestProvider>,
    );

    act(() => {
      jest.advanceTimersByTime(3_000);
    });

    expect(windowApi.appLoaded).toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Ledger Wallet is currently unavailable" }),
    ).toBeVisible();
    expect(screen.queryByText("App")).toBeNull();
  });

  it("should keep a resolved geo-block when CAL is still pending at the cap", () => {
    mockedUseAppAvailability.mockReturnValue({ status: "unavailable", reason: "geoBlocked" });
    mockedUseCalCheck.mockReturnValue({ status: "pending" });

    render(
      <I18nTestProvider resources={COPY}>
        <LiftSplashOnAppAvailability>
          <div>App</div>
        </LiftSplashOnAppAvailability>
      </I18nTestProvider>,
    );

    act(() => {
      jest.advanceTimersByTime(3_000);
    });

    expect(windowApi.appLoaded).toHaveBeenCalled();
    expect(screen.getByText("App")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Ledger Wallet is currently unavailable" }),
    ).toBeNull();
  });
});
