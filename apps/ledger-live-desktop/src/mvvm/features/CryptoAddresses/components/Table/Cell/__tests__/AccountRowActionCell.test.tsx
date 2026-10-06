import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { AccountRowActionCell } from "../AccountRowActionCell";
import { createWalletState } from "../../../../testUtils/createWalletState";

const ARIA_LABEL = "Edit name";
const onEditName = jest.fn();

const renderCell = (isSyncing: boolean) =>
  render(
    <AccountRowActionCell
      account={ETH_ACCOUNT}
      editNameAriaLabel={ARIA_LABEL}
      isSyncing={isSyncing}
      onEditName={onEditName}
    />,
    { initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "My ETH"]])) },
  );

describe("AccountRowActionCell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when not syncing", () => {
    it("renders an enabled edit button", () => {
      renderCell(false);
      expect(screen.getByRole("button", { name: ARIA_LABEL })).toBeEnabled();
    });

    it("requests the name edition of its account when clicked", async () => {
      const { user } = renderCell(false);

      await user.click(screen.getByRole("button", { name: ARIA_LABEL }));

      expect(onEditName).toHaveBeenCalledWith(ETH_ACCOUNT);
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
          onEditName={onEditName}
        />
      </div>,
      { initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "My ETH"]])) },
    );

    await user.click(screen.getByRole("button", { name: ARIA_LABEL }));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
