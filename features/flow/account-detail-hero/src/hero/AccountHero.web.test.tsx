import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper } from "../__tests__/i18nWrapper";
import { AccountHero } from "./AccountHero.web";
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
    platform: "desktop",
    balance: {
      countervalue: 4000,
      formatter: () => ({
        integerPart: "4,000",
        decimalPart: "00",
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

const actionIds = () =>
  screen
    .getAllByRole("button")
    .map(button => button.getAttribute("data-testid")?.replace(`${TEST_ID}-actions-`, ""));

describe("AccountHero (Web)", () => {
  it("renders the balance and Receive · Send · Buy · Sell · Earn", () => {
    renderHero();

    expect(screen.getByTestId(`${TEST_ID}-balance`)).toBeInTheDocument();
    expect(actionIds()).toEqual(["receive", "send", "buy", "sell", "earn"]);
    expect(screen.getByRole("button", { name: "Receive" })).toBeEnabled();
  });

  it("disables Send, Sell and Earn without funds", () => {
    renderHero({ hasFunds: false });

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sell" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Earn" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Buy" })).toBeEnabled();
  });

  it("hides Buy, Sell and Earn when they are not available", () => {
    renderHero({
      availability: availability({
        isBuyAvailable: false,
        isSellAvailable: false,
        isEarnAvailable: false,
      }),
    });

    expect(actionIds()).toEqual(["receive", "send"]);
  });

  it("renders no action for an unsupported currency", () => {
    renderHero({ availability: availability({ isCurrencySupported: false }) });

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("forwards the pressed action to the port", async () => {
    const { port, user } = renderHero();

    await user.click(screen.getByRole("button", { name: "Earn" }));

    expect(port.onAction).toHaveBeenCalledWith("earn");
  });
});
