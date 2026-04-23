import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { AccountRowActionCell } from "../AccountRowActionCell";
import { createWalletState } from "../../../../testUtils/createWalletState";

const ARIA_LABEL = "Edit name";

const renderCell = (isSyncing: boolean) =>
  render(
    <AccountRowActionCell
      account={ETH_ACCOUNT}
      editNameAriaLabel={ARIA_LABEL}
      isSyncing={isSyncing}
    />,
    { initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "My ETH"]])) },
  );

describe("AccountRowActionCell", () => {
  describe("when not syncing", () => {
    it("renders an enabled edit button", () => {
      renderCell(false);
      expect(screen.getByRole("button", { name: ARIA_LABEL })).toBeEnabled();
    });

    it("opens the edit name dialog when clicked", async () => {
      const { user } = renderCell(false);
      expect(
        screen.queryByTestId("edit-crypto-address-name-dialog-content"),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: ARIA_LABEL }));

      await waitFor(() => {
        expect(screen.getByTestId("edit-crypto-address-name-dialog-content")).toBeVisible();
      });
    });
  });

  describe("when syncing", () => {
    it("renders a disabled edit button", () => {
      renderCell(true);
      expect(screen.getByRole("button", { name: ARIA_LABEL })).toBeDisabled();
    });

    it("shows a tooltip explaining sync is in progress on hover", async () => {
      const { user } = renderCell(true);

      await user.hover(screen.getByRole("button", { name: ARIA_LABEL }));

      await waitFor(() => {
        const tooltips = screen.getAllByText("Sync in progress, please wait");
        expect(tooltips.some(el => el.closest("[role='tooltip']"))).toBe(true);
      });
    });
  });

  it("does not propagate clicks to the parent", async () => {
    const parentClick = jest.fn();
    const { user } = render(
      <div onClick={parentClick}>
        <AccountRowActionCell
          account={ETH_ACCOUNT}
          editNameAriaLabel={ARIA_LABEL}
          isSyncing={false}
        />
      </div>,
      { initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "My ETH"]])) },
    );

    await user.click(screen.getByRole("button", { name: ARIA_LABEL }));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
