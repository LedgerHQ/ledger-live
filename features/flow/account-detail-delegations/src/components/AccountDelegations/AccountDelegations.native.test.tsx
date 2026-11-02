import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { AccountDelegations } from "./AccountDelegations";
import type { AccountDelegationsProps, DelegationRow } from "./AccountDelegations.types";

const row = (overrides: Partial<DelegationRow> = {}): DelegationRow => ({
  id: "stake-1",
  validator: { name: "Ledger by Figment" },
  status: { label: "Active", appearance: "success" },
  cells: {
    delegated: { value: "12 SOL", sensitive: true },
    share: { value: "100 %" },
  },
  actions: [
    { id: "deactivate", label: "Deactivate" },
    { id: "withdraw", label: "Withdraw", disabledReason: "Nothing to withdraw yet" },
  ],
  ...overrides,
});

const renderDelegations = (overrides: Partial<AccountDelegationsProps> = {}) => {
  const handlers = {
    onSelectRowAction: jest.fn(),
    onSelectHeaderAction: jest.fn(),
    onStartDelegating: jest.fn(),
    onOpenValidator: jest.fn(),
    onLearnMore: jest.fn(),
    onSelectFooterAction: jest.fn(),
  };
  render(
    <AccountDelegations
      title="Delegations"
      validatorColumnLabel="Validator"
      statusColumnLabel="Status"
      columns={[
        { id: "delegated", label: "Delegated" },
        { id: "share", label: "Active" },
      ]}
      rows={[row()]}
      headerActions={[{ id: "delegate", label: "Delegate" }]}
      rowActionsLabel="Manage"
      openValidatorLabel="View validator"
      testID="delegations"
      {...handlers}
      {...overrides}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
};

describe("AccountDelegations (Native)", () => {
  it("lists the validator with its main amount", () => {
    renderDelegations();

    expect(screen.getByText("Delegations")).toBeVisible();
    expect(screen.getByText("Ledger by Figment")).toBeVisible();
    expect(screen.getByText("12 SOL")).toBeVisible();
  });

  it("hides the sensitive amount in discreet mode", () => {
    renderDelegations({ discreet: true });

    expect(screen.queryByText("12 SOL")).toBeNull();
    expect(screen.getByText("***")).toBeVisible();
  });

  it("runs a header action", async () => {
    const { onSelectHeaderAction, user } = renderDelegations();

    await user.press(screen.getByText("Delegate"));

    expect(onSelectHeaderAction).toHaveBeenCalledWith("delegate");
  });

  it("shows why a header action is disabled", () => {
    renderDelegations({
      headerActions: [{ id: "claim", label: "Claim", disabledReason: "No rewards yet" }],
    });

    expect(screen.getByText("No rewards yet")).toBeVisible();
  });

  it("opens the row sheet with the details and runs an action from it", async () => {
    const { onSelectRowAction, user } = renderDelegations();

    await user.press(screen.getByTestId("delegation-row-stake-1"));
    expect(screen.getByText("100 %")).toBeVisible();
    await user.press(screen.getByTestId("delegation-row-stake-1-action-deactivate"));

    expect(onSelectRowAction).toHaveBeenCalledWith("stake-1", "deactivate");
  });

  it("explains why a row action is disabled", async () => {
    const { onSelectRowAction, user } = renderDelegations();

    await user.press(screen.getByTestId("delegation-row-stake-1"));
    await user.press(screen.getByTestId("delegation-row-stake-1-action-withdraw"));

    expect(screen.getByText("Nothing to withdraw yet")).toBeVisible();
    expect(onSelectRowAction).not.toHaveBeenCalled();
  });

  it("opens the validator from the row sheet", async () => {
    const { onOpenValidator, user } = renderDelegations();

    await user.press(screen.getByTestId("delegation-row-stake-1"));
    await user.press(screen.getByTestId("delegation-row-stake-1-open-validator"));

    expect(onOpenValidator).toHaveBeenCalledWith("stake-1");
  });

  it("opens the details of a row without actions and the validator from them", async () => {
    const { onOpenValidator, user } = renderDelegations({ rows: [row({ actions: [] })] });

    await user.press(screen.getByTestId("delegation-row-stake-1"));
    expect(screen.getByText("100 %")).toBeVisible();
    await user.press(screen.getByTestId("delegation-row-stake-1-open-validator"));

    expect(onOpenValidator).toHaveBeenCalledWith("stake-1");
  });

  it("shows the empty state instead of the list and starts delegating from it", async () => {
    const { onStartDelegating, onLearnMore, user } = renderDelegations({
      rows: [],
      emptyState: {
        description: "Earn rewards on your SOL",
        learnMoreLabel: "Learn more",
        actionLabel: "Earn rewards",
      },
    });

    expect(screen.queryByText("Ledger by Figment")).toBeNull();
    await user.press(screen.getByText("Earn rewards"));
    await user.press(screen.getByText("Learn more"));

    expect(onStartDelegating).toHaveBeenCalledTimes(1);
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("shows loading rows instead of the list", () => {
    renderDelegations({ loading: true });

    expect(screen.getByTestId("delegations-loading")).toBeVisible();
    expect(screen.queryByText("Ledger by Figment")).toBeNull();
  });

  it("shows the validator description, the status and its explanation in the sheet", async () => {
    const { user } = renderDelegations({
      rows: [
        row({
          validator: { name: "Ledger by Figment", description: "Top validator" },
          status: { label: "Active", appearance: "success", tooltip: "Earning rewards" },
        }),
      ],
    });

    expect(screen.getByText("Top validator")).toBeVisible();
    await user.press(screen.getByTestId("delegation-row-stake-1"));

    expect(screen.getByText("Earning rewards")).toBeVisible();
  });

  it("hides the sensitive values of the sheet in discreet mode", async () => {
    const { user } = renderDelegations({ discreet: true });

    await user.press(screen.getByTestId("delegation-row-stake-1"));

    expect(screen.queryByText("12 SOL")).toBeNull();
    expect(screen.getAllByText("***").length).toBeGreaterThan(1);
  });

  it("closes the sheet once an action is chosen", async () => {
    const { user } = renderDelegations();

    await user.press(screen.getByTestId("delegation-row-stake-1"));
    await user.press(screen.getByTestId("delegation-row-stake-1-action-deactivate"));

    expect(screen.queryByTestId("delegation-row-stake-1-action-deactivate")).toBeNull();
  });

  it("does not offer to open the validator without a label", async () => {
    const { user } = renderDelegations({ openValidatorLabel: undefined });

    await user.press(screen.getByTestId("delegation-row-stake-1"));

    expect(screen.queryByTestId("delegation-row-stake-1-open-validator")).toBeNull();
  });

  it("does not run a disabled header action", async () => {
    const { onSelectHeaderAction, user } = renderDelegations({
      headerActions: [{ id: "claim", label: "Claim", disabledReason: "No rewards yet" }],
    });

    await user.press(screen.getByText("Claim"));

    expect(onSelectHeaderAction).not.toHaveBeenCalled();
  });

  it("shows the footer under the rows and runs its action", async () => {
    const { onSelectFooterAction, user } = renderDelegations({
      footer: { title: "Votes left", description: "Use them", actionLabel: "Vote" },
    });

    await user.press(screen.getByText("Vote"));

    expect(screen.getByTestId("delegations-footer")).toBeVisible();
    expect(onSelectFooterAction).toHaveBeenCalledTimes(1);
  });

  it("shows a footer without action and hides it while loading", () => {
    renderDelegations({ footer: { title: "Votes left", description: "Use them" } });
    expect(screen.queryByText("Vote")).toBeNull();

    screen.unmount();
    renderDelegations({ loading: true, footer: { title: "Votes left", description: "Use them" } });
    expect(screen.queryByTestId("delegations-footer")).toBeNull();
  });

  it("does not run a disabled empty state action", async () => {
    const { onStartDelegating, user } = renderDelegations({
      rows: [],
      emptyState: { description: "Vote", actionLabel: "Vote now", actionDisabled: true },
    });

    await user.press(screen.getByText("Vote now"));

    expect(onStartDelegating).not.toHaveBeenCalled();
  });

  it("shows nothing for an empty list without empty state", () => {
    renderDelegations({ rows: [], emptyState: undefined });

    expect(screen.queryByTestId("delegations-empty")).toBeNull();
  });
});
