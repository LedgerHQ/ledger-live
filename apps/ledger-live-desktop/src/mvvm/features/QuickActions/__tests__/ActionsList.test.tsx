import React from "react";
import { render, screen } from "tests/testSetup";
import { ActionsList } from "../components/ActionsList";
import { QuickAction } from "../types";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

jest.mock("../hooks/useQuickActions");

describe("ActionsList", () => {
  const mockHandlers = {
    onReceive: jest.fn(),
    onBuy: jest.fn(),
  };
  const mockActionsList: QuickAction[] = [
    {
      title: "receive",
      onAction: mockHandlers.onReceive,
      icon: Plus,
      disabled: false,
    },
    {
      title: "buy",
      onAction: mockHandlers.onBuy,
      icon: Plus,
      disabled: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all actions", () => {
    render(<ActionsList actionsList={mockActionsList} />);

    expect(screen.getByRole("button", { name: /receive/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buy/i })).toBeInTheDocument();
  });

  it("disables buttons correctly", () => {
    render(<ActionsList actionsList={mockActionsList} />);

    const receiveButton = screen.getByRole("button", { name: /receive/i });
    const buyButton = screen.getByRole("button", { name: /buy/i });

    expect(receiveButton).not.toBeDisabled();
    expect(buyButton).toBeDisabled();
  });

  it("calls action when enabled button is clicked", async () => {
    const { user } = render(<ActionsList actionsList={mockActionsList} />);

    const receiveButton = screen.getByRole("button", { name: /receive/i });
    await user.click(receiveButton);

    expect(mockHandlers.onReceive).toHaveBeenCalledTimes(1);
  });

  it("does not call action when disabled button is clicked", async () => {
    const { user } = render(<ActionsList actionsList={mockActionsList} />);

    const buyButton = screen.getByRole("button", { name: /buy/i });
    await user.click(buyButton);

    expect(mockHandlers.onBuy).not.toHaveBeenCalled();
  });
});
