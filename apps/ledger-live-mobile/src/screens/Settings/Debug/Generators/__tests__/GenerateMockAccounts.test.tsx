import React from "react";
import { render, screen } from "@tests/test-renderer";
import GenerateMockAccountsButton from "../GenerateMockAccounts";
import { GenerateMockAccountSelectScreen } from "../GenerateMockAccountsSelect";
import { UUID_REGEX, setupAlertSpy } from "./generateMockAccounts.testUtils";

const MOCK_UUID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
jest.mock("uuid", () => ({
  v4: jest.fn(() => MOCK_UUID),
}));

const mockGenAccount = jest.fn(() => ({ id: "account-1" }));
jest.mock("@ledgerhq/live-common/mock/account", () => ({
  genAccount: (...args: unknown[]) => Reflect.apply(mockGenAccount, null, args),
}));

jest.mock("~/actions/accounts", () => ({
  replaceAccounts: jest.fn((accounts: unknown) => ({ type: "REPLACE_ACCOUNTS", accounts })),
}));

jest.mock("~/actions/appstate", () => ({
  reboot: jest.fn(() => ({ type: "REBOOT" })),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  listSupportedCurrencies: () => [{ id: "ethereum", ticker: "ETH", name: "Ethereum" }],
}));

describe("GenerateMockAccountsButton", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = setupAlertSpy();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("should call genAccount with uuid when generating mock accounts", async () => {
    const { user } = render(
      <GenerateMockAccountsButton count={2} title="Generate" desc="Description" />,
    );

    const row = await screen.findByText("Generate");
    await user.press(row);

    expect(mockGenAccount).toHaveBeenCalled();
    expect(mockGenAccount.mock.calls.every((call: unknown[]) => call[0] === MOCK_UUID)).toBe(true);
  });

  it("should pass a uuid-shaped seed to genAccount for each account", async () => {
    const { user } = render(
      <GenerateMockAccountsButton count={3} title="Generate" desc="Description" />,
    );

    const row = await screen.findByText("Generate");
    await user.press(row);

    expect(mockGenAccount).toHaveBeenCalledTimes(3);
    mockGenAccount.mock.calls.forEach((call: unknown[]) => {
      expect(String(call[0])).toMatch(UUID_REGEX);
    });
  });
});

describe("GenerateMockAccountSelectScreen", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = setupAlertSpy();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("should call genAccount with uuid when generating mock accounts from select screen", async () => {
    const { user } = render(<GenerateMockAccountSelectScreen />);

    const currencyLabel = await screen.findByText("Ethereum");
    await user.press(currencyLabel);

    const generateButton = await screen.findByText("Generate Accounts");
    await user.press(generateButton);

    expect(mockGenAccount).toHaveBeenCalled();
    expect(mockGenAccount.mock.calls.every((call: unknown[]) => call[0] === MOCK_UUID)).toBe(true);
  });

  it("should pass a uuid-shaped seed to genAccount when generating from select", async () => {
    const { user } = render(<GenerateMockAccountSelectScreen />);

    const currencyLabel = await screen.findByText("Ethereum");
    await user.press(currencyLabel);

    const generateButton = await screen.findByText("Generate Accounts");
    await user.press(generateButton);

    expect(mockGenAccount).toHaveBeenCalled();
    mockGenAccount.mock.calls.forEach((call: unknown[]) => {
      expect(String(call[0])).toMatch(UUID_REGEX);
    });
  });
});
