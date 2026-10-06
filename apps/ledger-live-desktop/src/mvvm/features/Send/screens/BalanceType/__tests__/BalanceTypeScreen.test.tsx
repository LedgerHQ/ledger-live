/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { BalanceTypeScreen } from "../BalanceTypeScreen";
import { useBalanceTypeScreenViewModel } from "../hooks/useBalanceTypeScreenViewModel";

jest.mock("../hooks/useBalanceTypeScreenViewModel", () => ({
  useBalanceTypeScreenViewModel: jest.fn(),
}));

jest.mock("../components/BalanceTypeScreenInner", () => ({
  BalanceTypeScreenInner: () => <div data-testid="balance-type-options" />,
}));

jest.mock("../components/FamilyBalanceTypeSync", () => ({
  FamilyBalanceTypeSync: () => <div data-testid="balance-type-family-sync" />,
}));

const mockedUseViewModel = jest.mocked(useBalanceTypeScreenViewModel);

function mockViewModel(isPending: boolean) {
  mockedUseViewModel.mockReturnValue({
    ready: true,
    selectedOptionId: null,
    options: [],
    onSelect: jest.fn(),
    sync: { isPending, onComplete: jest.fn(), onCancel: jest.fn() },
  });
}

describe("BalanceTypeScreen", () => {
  it("shows only the balance options while no family sync is pending", () => {
    mockViewModel(false);

    render(<BalanceTypeScreen />);

    expect(screen.getByTestId("balance-type-options")).toBeVisible();
    expect(screen.queryByTestId("balance-type-family-sync")).toBeNull();
  });

  it("swaps the balance options for the family sync while it is pending", () => {
    mockViewModel(true);

    render(<BalanceTypeScreen />);

    expect(screen.getByTestId("balance-type-family-sync")).toBeVisible();
    expect(screen.queryByTestId("balance-type-options")).toBeNull();
  });
});
