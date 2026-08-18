import React from "react";
import { View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { BalanceFilterPickerViewProps } from "../types";
import { BalanceFilterPickerView } from "../components/Filter/BalanceFilterPickerView.native";
import { filterLabels, options, usdcOption } from "./fixtures";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isRequestingToBeOpened }}>
      {children}
    </View>
  ),
}));

jest.mock("@ledgerhq/crypto-icons/native", () => () => null);

function buildProps(
  overrides: Partial<BalanceFilterPickerViewProps> = {},
): BalanceFilterPickerViewProps {
  return {
    isOpen: true,
    draftFilter: "all",
    options,
    labels: filterLabels,
    onClose: jest.fn(),
    onSelectDraft: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
}

describe("BalanceFilterPickerView (Native)", () => {
  it("should not render the picker content while closed", () => {
    render(<BalanceFilterPickerView {...buildProps({ isOpen: false })} />);

    expect(screen.queryByTestId("pay-card-balance-filter-picker")).toBeNull();
  });

  it("should render every option and the confirm button when open", () => {
    render(<BalanceFilterPickerView {...buildProps()} />);

    expect(screen.getByTestId("pay-card-balance-filter-picker")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-filter-option-all")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-filter-option-usdc")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-filter-option-usdt")).toBeTruthy();
    expect(screen.getByText(filterLabels.confirm)).toBeTruthy();
  });

  it("should draft-select the pressed option", () => {
    const onSelectDraft = jest.fn();
    render(<BalanceFilterPickerView {...buildProps({ onSelectDraft })} />);

    fireEvent.press(screen.getByTestId("pay-card-balance-filter-option-usdc"));

    expect(onSelectDraft).toHaveBeenCalledWith(usdcOption.id);
  });

  it("should confirm the current draft", () => {
    const onConfirm = jest.fn();
    render(<BalanceFilterPickerView {...buildProps({ draftFilter: usdcOption.id, onConfirm })} />);

    fireEvent.press(screen.getByTestId("pay-card-balance-filter-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
