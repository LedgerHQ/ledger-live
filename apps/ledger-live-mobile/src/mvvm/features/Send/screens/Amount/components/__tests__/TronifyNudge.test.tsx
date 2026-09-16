import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { TronifyNudge } from "../TronifyNudge";
import type { TronifyFeesViewModel } from "../../../../types";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string, params?: Record<string, string>) => {
    if (params?.savings) return `${key}:${params.savings}`;
    return key;
  }}),
}));

jest.mock("@ledgerhq/lumen-ui-rnative/styles", () => ({
  useStyleSheet: (fn: (theme: unknown) => unknown) =>
    fn({
      spacings: { s4: 4, s8: 8, s16: 16 },
      colors: { success: { background: "#00AA00" } },
    }),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  Text: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseViewModel: TronifyFeesViewModel = {
  available: true,
  selected: false,
  discountedFeeFormatted: "0.12 USDT",
  originalFeeFormatted: "1.50 TRX",
  savingsFiatFormatted: "$1.38",
  onSelectTronify: jest.fn(),
  onSelectStandard: jest.fn(),
  insufficientBalance: false,
};

describe("TronifyNudge", () => {
  it("renders nothing when Tronify is not available", () => {
    const { toJSON } = render(
      <TronifyNudge
        viewModel={{ ...baseViewModel, available: false }}
        onOpenSelector={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders nudge text when standard is selected and savings exist", () => {
    render(
      <TronifyNudge
        viewModel={{ ...baseViewModel, selected: false }}
        onOpenSelector={jest.fn()}
      />,
    );
    expect(
      screen.getByText("send.newSendFlow.tronifyNudge:$1.38"),
    ).toBeTruthy();
  });

  it("renders nothing when standard is selected but no savings", () => {
    const { toJSON } = render(
      <TronifyNudge
        viewModel={{ ...baseViewModel, selected: false, savingsFiatFormatted: null }}
        onOpenSelector={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders saved badge when Tronify is selected and savings exist", () => {
    render(
      <TronifyNudge
        viewModel={{ ...baseViewModel, selected: true }}
        onOpenSelector={jest.fn()}
      />,
    );
    expect(
      screen.getByText("send.newSendFlow.tronifySaved:$1.38"),
    ).toBeTruthy();
  });

  it("renders error text when Tronify is selected with insufficient balance", () => {
    render(
      <TronifyNudge
        viewModel={{ ...baseViewModel, selected: true, insufficientBalance: true }}
        onOpenSelector={jest.fn()}
      />,
    );
    expect(
      screen.getByText("send.newSendFlow.tronifyInsufficientBalance"),
    ).toBeTruthy();
  });

  it("calls onOpenSelector when nudge is pressed", () => {
    const onOpenSelector = jest.fn();
    render(
      <TronifyNudge
        viewModel={{ ...baseViewModel, selected: false }}
        onOpenSelector={onOpenSelector}
      />,
    );
    fireEvent.press(screen.getByText("send.newSendFlow.tronifyNudge:$1.38"));
    expect(onOpenSelector).toHaveBeenCalledTimes(1);
  });
});
