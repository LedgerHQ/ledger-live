import React from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import SendBroadcastError from "./07-SendBroadcastError";
import useExportLogs from "~/components/useExportLogs";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

jest.mock("@ledgerhq/live-common/account/helpers", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/helpers"),
  getAccountCurrency: jest.fn(),
}));

jest.mock("~/components/useExportLogs", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockAccount = genAccount("account-1", { currency: getCryptoCurrencyById("bitcoin") });

const mockCurrency = {
  name: "Bitcoin",
  ticker: "BTC",
};

const mockExportLogs = jest.fn();

const setup = (error: Error | null, url: string | null = null) => {
  const mockRoute = {
    params: {
      error: error ? { ...error, url } : null,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  (getAccountCurrency as jest.Mock).mockReturnValue(mockCurrency);
  (useExportLogs as jest.Mock).mockReturnValue(mockExportLogs);

  render(<SendBroadcastError navigation={mockNavigation} route={mockRoute} />, {
    overrideInitialState: (state: State) => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: [mockAccount],
      },
    }),
  });
};

describe("SendBroadcastError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should show Retry button for 'LedgerAPI5xx' error", () => {
    const apiError = {
      name: "LedgerAPI5xx",
      message: "API is down",
    };
    setup(apiError);
    expect(screen.queryByText(/Retry/i)).toBeTruthy();
    expect(screen.queryByText(/Abort/i)).toBeFalsy();
  });

  test("should show Retry button for 'NetworkDown' error", () => {
    const networkError = {
      name: "NetworkDown",
      message: "No internet connection",
    };
    setup(networkError);

    expect(screen.queryByText(/Retry/i)).toBeTruthy();
    expect(screen.queryByText(/Abort/i)).toBeNull();
  });

  test("should show Retry button for 'DeviceLockedError' error", () => {
    const networkError = {
      name: "DeviceLockedError",
      message: "Device is locked",
    };
    setup(networkError);

    expect(screen.queryByText(/Retry/i)).toBeTruthy();
    expect(screen.queryByText(/Abort/i)).toBeNull();
  });

  test("should show Retry button for 'LockedDeviceError' error", () => {
    const networkError = {
      name: "LockedDeviceError",
      message: "Device is locked (bis)",
    };
    setup(networkError);

    expect(screen.queryByText(/Retry/i)).toBeTruthy();
    expect(screen.queryByText(/Abort/i)).toBeNull();
  });

  test("should show Retry button for 'UserRefusedOnDevice' error", () => {
    const networkError = {
      name: "UserRefusedOnDevice",
      message: "User refused the action on device",
    };
    setup(networkError);

    expect(screen.queryByText(/Retry/i)).toBeTruthy();
    expect(screen.queryByText(/Abort/i)).toBeNull();
  });

  test("should show Abort button for other errors", () => {
    const networkError = {
      name: "LedgerAPI4xx",
      message: "Invalid tx",
    };
    setup(networkError);

    expect(screen.queryByText(/Abort/i)).toBeTruthy();
    expect(screen.queryByText(/Retry/i)).toBeNull();
  });
});
