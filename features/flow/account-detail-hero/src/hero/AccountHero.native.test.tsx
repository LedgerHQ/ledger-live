import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { I18nWrapper } from "../__tests__/i18nWrapper";
import { AccountHero } from "./AccountHero.native";
import type { AccountHeroAvailability, AccountHeroPort } from "./types";

const TEST_ID = "hero";

const availability = (
  overrides: Partial<AccountHeroAvailability> = {},
): AccountHeroAvailability => ({
  isCurrencySupported: true,
  isBuyAvailable: true,
  isSellAvailable: true,
  isSwapAvailable: true,
  isEarnAvailable: true,
  isSendSupported: true,
  isReceiveSupported: true,
  ...overrides,
});

function renderHero(overrides: Partial<AccountHeroPort> = {}) {
  const port: AccountHeroPort = {
    platform: "mobile",
    balance: {
      countervalue: 1234.56,
      formatter: () => ({
        integerPart: "1,234",
        decimalPart: "56",
        currencyText: "$",
        decimalSeparator: ".",
        currencyPosition: "start",
      }),
      discreet: false,
      isLoading: false,
    },
    availability: availability(),
    hasFunds: true,
    hasActivity: true,
    onAction: jest.fn(),
    ...overrides,
  };
  render(<AccountHero {...port} testID={TEST_ID} />, { wrapper: I18nWrapper });
  return { port, user: userEvent.setup() };
}

describe("AccountHero (Native)", () => {
  it("renders the balance and the Transfer · Swap · More tiles", () => {
    renderHero();

    expect(screen.getByTestId(`${TEST_ID}-balance`)).toBeVisible();
    expect(screen.getByText("Transfer")).toBeVisible();
    expect(screen.getByText("Swap")).toBeVisible();
    expect(screen.getByText("More")).toBeVisible();
  });

  it("renders Buy and Sell tiles when Swap is unavailable", () => {
    renderHero({ availability: availability({ isSwapAvailable: false, isEarnAvailable: false }) });

    expect(screen.getByText("Buy")).toBeVisible();
    expect(screen.getByText("Sell")).toBeVisible();
    expect(screen.queryByText("Swap")).toBeNull();
    expect(screen.queryByText("More")).toBeNull();
  });

  it("hides the balance when there is no countervalue and nothing is loading", () => {
    renderHero({
      balance: {
        countervalue: undefined,
        formatter: jest.fn(),
        discreet: false,
        isLoading: false,
      },
    });

    expect(screen.queryByTestId(`${TEST_ID}-balance`)).toBeNull();
  });

  it("renders only the Transfer tile for an unsupported currency", () => {
    renderHero({ availability: availability({ isCurrencySupported: false }) });

    expect(screen.getByText("Transfer")).toBeVisible();
    expect(screen.queryByText("Swap")).toBeNull();
    expect(screen.queryByText("More")).toBeNull();
  });

  it("forwards a tile press to the port", async () => {
    const { port, user } = renderHero();

    await user.press(screen.getByTestId(`${TEST_ID}-actions-transfer`));

    expect(port.onAction).toHaveBeenCalledWith("transfer");
  });

  it("opens the More sheet, then closes it and forwards the picked action", async () => {
    const { port, user } = renderHero();
    const moreSheet = () => screen.getByTestId(`${TEST_ID}-more-sheet`);

    expect(moreSheet()).toBeCollapsed();

    await user.press(screen.getByTestId(`${TEST_ID}-actions-more`));

    expect(moreSheet()).toBeExpanded();

    await user.press(screen.getByTestId(`${TEST_ID}-more-sheet-earn`));

    expect(moreSheet()).toBeCollapsed();
    expect(port.onAction).toHaveBeenCalledWith("earn");
  });
});
