import React from "react";
import { render, screen } from "@testing-library/react";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import type { FundingAction } from "../../logic/resolveEmptyState";
import { AccountEmptyState } from "./AccountEmptyState.web";

const TEST_ID = "empty-state";

const renderEmptyState = (fundingActions: readonly FundingAction[]) =>
  render(<AccountEmptyState fundingActions={fundingActions} testID={TEST_ID} />, {
    wrapper: I18nWrapper,
  });

describe("AccountEmptyState (Web)", () => {
  it.each([
    [["receive"], "Start by adding funds through Receive."],
    [["receive", "swap"], "Start by adding funds through Receive or Swap."],
    [["receive", "buy"], "Start by adding funds through Receive or Buy."],
    [["receive", "swap", "buy"], "Start by adding funds through Receive, Swap or Buy."],
    [["swap", "buy"], "Start by adding funds through Swap or Buy."],
  ] as const)("shows the title and the description for %o", (actions, description) => {
    renderEmptyState(actions);

    expect(screen.getByTestId(TEST_ID)).toBeInTheDocument();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("shows only the title without any funding action", () => {
    renderEmptyState([]);

    expect(screen.getByText("No activity yet")).toBeInTheDocument();
    expect(screen.queryByText(/Start by adding funds/)).toBeNull();
  });

  it("renders no button", () => {
    renderEmptyState(["receive", "swap", "buy"]);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
