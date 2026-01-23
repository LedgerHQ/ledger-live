import React from "react";
import { render, screen } from "tests/testSetup";
import { ActionsList } from "../components/ActionsList";
import { useQuickActions } from "../hooks/useQuickActions";

jest.mock("../hooks/useQuickActions");

const mockUseQuickActions = useQuickActions as jest.MockedFunction<typeof useQuickActions>;

describe("ActionsList", () => {
  const mockHandlers = {
    onSend: jest.fn(),
    onReceive: jest.fn(),
    onBuy: jest.fn(),
    onSell: jest.fn(),
  };

  beforeEach(() => {
    mockUseQuickActions.mockReturnValue(mockHandlers);
    jest.clearAllMocks();
  });

  it("calls onReceive when receive button is clicked", async () => {
    const { user } = render(<ActionsList />);

    const receiveButton = screen.getByRole("button", { name: /receive/i });
    await user.click(receiveButton);

    expect(mockHandlers.onReceive).toHaveBeenCalledTimes(1);
  });

  it("calls onBuy when buy button is clicked", async () => {
    const { user } = render(<ActionsList />);

    const buyButton = screen.getByRole("button", { name: /buy/i });
    await user.click(buyButton);

    expect(mockHandlers.onBuy).toHaveBeenCalledTimes(1);
  });

  it("calls onSell when sell button is clicked", async () => {
    const { user } = render(<ActionsList hasFunds={true} />);

    const sellButton = screen.getByRole("button", { name: /sell/i });
    await user.click(sellButton);

    expect(mockHandlers.onSell).toHaveBeenCalledTimes(1);
  });

  it("calls onSend when send button is clicked", async () => {
    const { user } = render(<ActionsList />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    expect(mockHandlers.onSend).toHaveBeenCalledTimes(1);
  });

  it("disables sell button when hasFunds is false", () => {
    render(<ActionsList hasFunds={false} />);

    const sellButton = screen.getByRole("button", { name: /sell/i });
    expect(sellButton).toBeDisabled();
  });

  it("enables sell button when hasFunds is true", () => {
    render(<ActionsList hasFunds={true} />);

    const sellButton = screen.getByRole("button", { name: /sell/i });
    expect(sellButton).not.toBeDisabled();
  });
});
