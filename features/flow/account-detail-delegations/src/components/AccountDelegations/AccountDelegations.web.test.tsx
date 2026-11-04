import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusTag } from "../../internals/StatusTag";
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
        { id: "delegated", label: "Delegated", align: "end" },
        { id: "share", label: "Active", align: "end" },
      ]}
      rows={[row()]}
      headerActions={[{ id: "delegate", label: "Delegate" }]}
      rowActionsLabel="Manage"
      testID="delegations"
      {...handlers}
      {...overrides}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
};

describe("AccountDelegations (Web)", () => {
  it("shows the validator, its cells and the column headers", () => {
    renderDelegations();

    expect(screen.getByText("Delegations")).toBeInTheDocument();
    expect(screen.getByText("Validator")).toBeInTheDocument();
    expect(screen.getByText("Delegated")).toBeInTheDocument();
    expect(screen.getByText("Ledger by Figment")).toBeInTheDocument();
    expect(screen.getByText("12 SOL")).toBeInTheDocument();
    expect(screen.getByText("100 %")).toBeInTheDocument();
  });

  it("hides the sensitive cells in discreet mode and keeps the others", () => {
    renderDelegations({ discreet: true });

    expect(screen.queryByText("12 SOL")).toBeNull();
    expect(screen.getByText("***")).toBeInTheDocument();
    expect(screen.getByText("100 %")).toBeInTheDocument();
  });

  it("opens the validator from anywhere on the row", async () => {
    const { onOpenValidator, user } = renderDelegations();

    await user.click(screen.getByText("12 SOL"));

    expect(onOpenValidator).toHaveBeenCalledWith("stake-1");
  });

  it("does not open the validator when a row action is chosen", async () => {
    const { onOpenValidator, onSelectRowAction, user } = renderDelegations();

    await user.click(screen.getByText("Deactivate"));

    expect(onSelectRowAction).toHaveBeenCalledWith("stake-1", "deactivate");
    expect(onOpenValidator).not.toHaveBeenCalled();
  });

  it("runs a header action", async () => {
    const { onSelectHeaderAction, user } = renderDelegations();

    await user.click(screen.getByRole("button", { name: "Delegate" }));

    expect(onSelectHeaderAction).toHaveBeenCalledWith("delegate");
  });

  it("disables a header action and shows its reason next to the header", () => {
    renderDelegations({
      headerActions: [{ id: "claim", label: "Claim", disabledReason: "No rewards yet" }],
    });

    const claim = screen.getByRole("button", { name: "Claim" });
    expect(claim).toBeDisabled();
    expect(screen.getByText("No rewards yet")).toBeInTheDocument();
    expect(claim).toHaveAccessibleDescription("No rewards yet");
  });

  it("lets keyboard users reach the explanation of a status", () => {
    const { container } = render(
      <StatusTag status={{ label: "Active", appearance: "success", tooltip: "Earning rewards" }} />,
    );

    expect(container.querySelector('[tabindex="0"]')).not.toBeNull();
  });

  it("does not make a status without explanation focusable", () => {
    const { container } = render(<StatusTag status={{ label: "Active", appearance: "success" }} />);

    expect(container.querySelector("[tabindex]")).toBeNull();
  });

  it("falls back to the title and the validator name when the web labels are omitted", () => {
    renderDelegations({
      validatorColumnLabel: undefined,
      statusColumnLabel: undefined,
      rowActionsLabel: undefined,
    });

    expect(screen.getAllByText("Delegations")).toHaveLength(2);
    expect(screen.queryByText("Status")).toBeNull();
    expect(screen.getByLabelText("Ledger by Figment")).toBeInTheDocument();
  });

  it("shows no empty state when none is given for an empty list", () => {
    renderDelegations({ rows: [], emptyState: undefined });

    expect(screen.queryByTestId("delegations-empty")).toBeNull();
    expect(screen.queryByText("Validator")).toBeNull();
  });

  it("runs a row action from the row menu", async () => {
    const { onSelectRowAction, user } = renderDelegations();

    await user.click(screen.getByText("Deactivate"));

    expect(onSelectRowAction).toHaveBeenCalledWith("stake-1", "deactivate");
  });

  it("explains why a row action is disabled and does not run it", async () => {
    const { onSelectRowAction, user } = renderDelegations();

    const withdraw = screen.getByTestId("delegation-row-stake-1-action-withdraw");
    expect(within(withdraw).getByText("Nothing to withdraw yet")).toBeInTheDocument();
    await user.click(withdraw);

    expect(onSelectRowAction).not.toHaveBeenCalled();
  });

  it("shows the empty state and starts delegating from it", async () => {
    const { onStartDelegating, onLearnMore, user } = renderDelegations({
      rows: [],
      emptyState: {
        description: "Earn rewards on your SOL",
        learnMoreLabel: "Learn more",
        actionLabel: "Earn rewards",
      },
    });

    expect(screen.getByTestId("delegations-empty")).toHaveAttribute(
      "description",
      "Earn rewards on your SOL",
    );
    expect(screen.queryByText("Validator")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Earn rewards" }));
    await user.click(screen.getByText("Learn more"));

    expect(onStartDelegating).toHaveBeenCalledTimes(1);
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("disables the empty state action when asked to", () => {
    renderDelegations({
      rows: [],
      emptyState: { description: "Vote", actionLabel: "Vote now", actionDisabled: true },
    });

    expect(screen.getByRole("button", { name: "Vote now" })).toBeDisabled();
  });

  it("shows loading rows instead of the table", () => {
    renderDelegations({ loading: true });

    expect(screen.getByTestId("delegations-loading")).toBeInTheDocument();
    expect(screen.queryByText("Ledger by Figment")).toBeNull();
  });

  it("shows the footer under the rows only", async () => {
    const { onSelectFooterAction, user } = renderDelegations({
      footer: { title: "Votes left", description: "Use them", actionLabel: "Vote" },
    });

    expect(screen.getByTestId("delegations-footer")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vote" }));

    expect(onSelectFooterAction).toHaveBeenCalledTimes(1);
  });

  it("shows the validator description and an empty cell for a column without value", () => {
    renderDelegations({
      columns: [
        { id: "delegated", label: "Delegated" },
        { id: "missing", label: "Missing" },
      ],
      rows: [row({ validator: { name: "Ledger by Figment", description: "Top validator" } })],
    });

    expect(screen.getByText("Top validator")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
  });

  it("shows no actions column when no row has an action", () => {
    renderDelegations({ rows: [row({ actions: [] })] });

    expect(screen.queryByTestId("delegation-row-stake-1-actions")).toBeNull();
  });

  it("leaves a row without status empty in the status column", () => {
    renderDelegations({ rows: [row({ status: undefined })] });

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByTestId("delegation-row-stake-1")).toBeInTheDocument();
  });

  it("does nothing when a row is clicked without a validator handler", async () => {
    const { onSelectRowAction, user } = renderDelegations({ onOpenValidator: undefined });

    await user.click(screen.getByText("12 SOL"));

    expect(onSelectRowAction).not.toHaveBeenCalled();
  });

  it("shows the empty state without a learn more link when there is no handler", () => {
    renderDelegations({
      rows: [],
      onLearnMore: undefined,
      emptyState: {
        description: "Earn",
        learnMoreLabel: "Learn more",
        actionLabel: "Earn rewards",
      },
    });

    expect(screen.queryByText("Learn more")).toBeNull();
  });

  it("shows a footer without action and a footer with a disabled action", () => {
    renderDelegations({ footer: { title: "Votes left", description: "Use them" } });

    expect(screen.getByTestId("delegations-footer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vote" })).toBeNull();
  });

  it("disables the footer action when asked to", () => {
    renderDelegations({
      footer: {
        title: "Votes left",
        description: "Use them",
        actionLabel: "Vote",
        actionDisabled: true,
      },
    });

    expect(screen.getByRole("button", { name: "Vote" })).toBeDisabled();
  });

  it("hides the footer while loading", () => {
    renderDelegations({
      loading: true,
      footer: { title: "Votes left", description: "Use them" },
    });

    expect(screen.queryByTestId("delegations-footer")).toBeNull();
  });
});
