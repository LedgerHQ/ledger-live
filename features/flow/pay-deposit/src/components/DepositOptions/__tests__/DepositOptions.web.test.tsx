import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DepositOptions } from "../DepositOptions";
import type { DepositOptionsProps } from "../../../types";
import { DEPOSIT_RESOURCES, i18nWrapper } from "./i18nWrapper";
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

function renderDeposit(overrides: Partial<DepositOptionsProps> = {}) {
  const props: DepositOptionsProps = {
    isOpen: true,
    page: "Pay",
    onClose: jest.fn(),
    onSelect: jest.fn(),
    ...overrides,
  };
  return {
    props,
    ...render(<DepositOptions {...props} />, { wrapper: i18nWrapper(DEPOSIT_RESOURCES) }),
  };
}

describe("DepositOptions (Web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("wires the view-model: tracks, selects and closes on option press", async () => {
    const user = userEvent.setup();
    const { props } = renderDeposit();

    await user.click(screen.getByTestId("pay-card-deposit-option-swap"));

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "swap",
      buttonLocation: "deposit",
      page: "Pay",
    });
    expect(props.onSelect).toHaveBeenCalledWith("swap");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
