import React from "react";
import { PenEdit, Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { render, screen, waitFor } from "tests/testSetup";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { AccountRowActionCell } from "../AccountRowActionCell";
import { createWalletState } from "../../../../testUtils/createWalletState";

const onAction = jest.fn();

const VARIANTS = [
  { variant: "edit name", icon: PenEdit, ariaLabel: "Edit name" },
  { variant: "account settings", icon: Settings, ariaLabel: "Account settings" },
];

describe.each(VARIANTS)("AccountRowActionCell ($variant)", ({ icon, ariaLabel }) => {
  const renderCell = (isSyncing: boolean) =>
    render(
      <AccountRowActionCell
        account={ETH_ACCOUNT}
        icon={icon}
        ariaLabel={ariaLabel}
        isSyncing={isSyncing}
        onAction={onAction}
      />,
      { initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "My ETH"]])) },
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when not syncing", () => {
    it("renders an enabled button", () => {
      renderCell(false);
      expect(screen.getByRole("button", { name: ariaLabel })).toBeEnabled();
    });

    it("runs the action for its account when clicked", async () => {
      const { user } = renderCell(false);

      await user.click(screen.getByRole("button", { name: ariaLabel }));

      expect(onAction).toHaveBeenCalledWith(ETH_ACCOUNT);
    });
  });

  describe("when syncing", () => {
    it("renders a disabled button", () => {
      renderCell(true);
      expect(screen.getByRole("button", { name: ariaLabel })).toBeDisabled();
    });

    it("shows a tooltip explaining sync is in progress on hover", async () => {
      const { user } = renderCell(true);

      await user.hover(screen.getByRole("button", { name: ariaLabel }));

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
          icon={icon}
          ariaLabel={ariaLabel}
          isSyncing={false}
          onAction={onAction}
        />
      </div>,
      { initialState: createWalletState(new Map([[ETH_ACCOUNT.id, "My ETH"]])) },
    );

    await user.click(screen.getByRole("button", { name: ariaLabel }));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
