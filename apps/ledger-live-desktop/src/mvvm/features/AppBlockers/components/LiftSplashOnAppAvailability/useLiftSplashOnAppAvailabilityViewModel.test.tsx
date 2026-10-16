import React from "react";
import { useCalCheck } from "@features/flow-app-availability";
import { I18nTestProvider } from "@shared/i18n/testing";
import { act, render, screen } from "@testing-library/react";
import { LiftSplashOnAppAvailability } from "./index";

jest.mock("@features/flow-app-availability", () => ({
  ...jest.requireActual("@features/flow-app-availability"),
  useCalCheck: jest.fn(),
}));

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

  it("should lift the splash onto the app when the CAL check is still pending at the cap", () => {
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
