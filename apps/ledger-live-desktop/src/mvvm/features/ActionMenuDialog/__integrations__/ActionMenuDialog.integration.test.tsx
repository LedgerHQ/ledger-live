import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import { resolveActionMenuDialog } from "~/renderer/components/WebPTXPlayer/actionMenuDialogStore";
import { setActionMenuDialog } from "~/renderer/reducers/actionMenuDialog";
import ActionMenuDialog from "..";

jest.mock("~/renderer/components/WebPTXPlayer/actionMenuDialogStore", () => ({
  resolveActionMenuDialog: jest.fn(),
}));

const mockedResolve = jest.mocked(resolveActionMenuDialog);

const OPTIONS = [
  { id: "earn_more", label: "Earn more", icon: "deposit" as const },
  { id: "withdraw_all", label: "Withdraw all", icon: "withdraw" as const },
];

describe("ActionMenuDialog Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render a dialog when the store is empty", () => {
    render(<ActionMenuDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders every option when opened", async () => {
    const { store } = render(<ActionMenuDialog />);

    act(() => {
      store.dispatch(setActionMenuDialog({ options: OPTIONS }));
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });
    expect(screen.getByText("Earn more")).toBeVisible();
    expect(screen.getByText("Withdraw all")).toBeVisible();
  });

  it("resolves with the selected option id", async () => {
    const { store, user } = render(<ActionMenuDialog />);

    act(() => {
      store.dispatch(setActionMenuDialog({ options: OPTIONS }));
    });

    await user.click(await screen.findByText("Withdraw all"));

    expect(mockedResolve).toHaveBeenCalledWith("withdraw_all");
  });

  it("resolves with null when dismissed with Escape", async () => {
    const { store, user } = render(<ActionMenuDialog />);

    act(() => {
      store.dispatch(setActionMenuDialog({ options: OPTIONS }));
    });

    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    expect(mockedResolve).toHaveBeenCalledWith(null);
  });
});
