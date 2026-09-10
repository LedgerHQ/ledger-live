/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { BalanceTypeScreenInner } from "../BalanceTypeScreenInner";
import type { BalanceTypeScreenViewModel } from "../../hooks/useBalanceTypeScreenViewModel";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-react");
  return {
    ...actual,
    DialogBody: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  };
});

const PUBLIC_OPTION = {
  id: "public",
  translationKey: "balanceType.transparent",
  formattedBalance: "1 ZEC",
  formattedCounterValue: "$10.00",
  isZero: false,
  hasPendingBalance: false,
  icon: "check" as const,
};

const PRIVATE_OPTION = {
  id: "private",
  translationKey: "balanceType.shielded",
  formattedBalance: "2 ZEC",
  formattedCounterValue: "$20.00",
  isZero: false,
  hasPendingBalance: false,
  icon: "lock" as const,
};

function readyViewModel(
  overrides: Partial<Extract<BalanceTypeScreenViewModel, { ready: true }>> = {},
): Extract<BalanceTypeScreenViewModel, { ready: true }> {
  return {
    ready: true,
    selectedOptionId: null,
    options: [PUBLIC_OPTION, PRIVATE_OPTION],
    onSelect: jest.fn(),
    ...overrides,
  };
}

describe("BalanceTypeScreenInner", () => {
  it("should render public and private options as a stacked list", () => {
    render(<BalanceTypeScreenInner viewModel={readyViewModel()} />);

    expect(screen.getByTestId("balance-type-public")).toBeVisible();
    expect(screen.getByTestId("balance-type-private")).toBeVisible();
    expect(screen.getByText("Public balance")).toBeVisible();
    expect(screen.getByText("Private balance")).toBeVisible();
    expect(screen.getByText("$10.00")).toBeVisible();
    expect(screen.getByText("1 ZEC")).toBeVisible();
    expect(screen.getByText("$20.00")).toBeVisible();
    expect(screen.getByText("2 ZEC")).toBeVisible();
  });

  it("should select a pool when its list item is clicked", async () => {
    const onSelect = jest.fn();
    const { user } = render(<BalanceTypeScreenInner viewModel={readyViewModel({ onSelect })} />);

    await user.click(screen.getByTestId("balance-type-private"));

    expect(onSelect).toHaveBeenCalledWith("private");
  });

  it("should warn when a pool has no available balance", () => {
    render(
      <BalanceTypeScreenInner
        viewModel={readyViewModel({
          options: [{ ...PUBLIC_OPTION, isZero: true }, PRIVATE_OPTION],
        })}
      />,
    );

    expect(screen.getByTestId("balance-type-public-zero")).toBeVisible();
    expect(screen.getByText("No available balance")).toBeVisible();
  });

  it("should show a pending notice when a pool has maturing funds", () => {
    render(
      <BalanceTypeScreenInner
        viewModel={readyViewModel({
          options: [PUBLIC_OPTION, { ...PRIVATE_OPTION, hasPendingBalance: true }],
        })}
      />,
    );

    expect(screen.getByTestId("balance-type-private-pending-notice")).toBeVisible();
  });
});
