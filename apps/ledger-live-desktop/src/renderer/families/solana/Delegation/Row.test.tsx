import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { Account } from "@ledgerhq/types-live";
import type { SolanaStakeWithMeta } from "@ledgerhq/live-common/families/solana/types";
import { Row } from "./Row";

type DropDownItemShape = { key: string; label: React.ReactNode };

// The menu opens in a tooltip: each item is a button here, in the menu's order.
jest.mock("~/renderer/components/DropDownSelector", () => {
  const ReactActual = jest.requireActual<typeof import("react")>("react");
  return {
    __esModule: true,
    default: ({
      items,
      renderItem,
      onChange,
    }: {
      items: DropDownItemShape[];
      renderItem: (args: { item: DropDownItemShape; isActive: boolean }) => React.ReactNode;
      onChange: (item: DropDownItemShape) => void;
    }) =>
      ReactActual.createElement(
        "div",
        { role: "menu" },
        items.map(item =>
          ReactActual.createElement(
            "button",
            { type: "button", key: item.key, role: "menuitem", onClick: () => onChange(item) },
            renderItem({ item, isActive: false }),
          ),
        ),
      ),
    DropDownItem: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement("div", null, children),
  };
});

const account = {
  type: "Account",
  currency: {
    id: "solana",
    units: [{ code: "SOL", name: "SOL", magnitude: 9 }],
  },
} as unknown as Account;

const stakeWithMeta = (
  stake: Record<string, unknown>,
  meta: Record<string, unknown> = {},
): SolanaStakeWithMeta => ({ stake, meta }) as unknown as SolanaStakeWithMeta;

const bondedStake = {
  positionId: "stake-acc-1",
  validatorAddress: "vote-acc-1",
  status: "bonded",
  amount: new BigNumber(2_000_000_000),
  pendingRewards: new BigNumber(0),
  activeAmount: new BigNumber(2_000_000_000),
  withdrawableAmount: new BigNumber(500_000_000),
};

const renderRow = (
  item: SolanaStakeWithMeta,
  props: Partial<Pick<React.ComponentProps<typeof Row>, "onManageAction" | "onViewDetails">> = {},
) =>
  render(
    <Row
      account={account}
      stakeWithMeta={item}
      onManageAction={jest.fn()}
      onExternalLink={jest.fn()}
      {...props}
    />,
  );

const menuItems = () => screen.getAllByRole("menuitem").map(item => item.textContent);

describe("solana Delegation Row", () => {
  it("shows the validator name from the metadata when it is known", () => {
    renderRow(stakeWithMeta(bondedStake, { validator: { name: "Ledger Validator" } }));

    expect(screen.getByText("Ledger Validator")).toBeVisible();
  });

  it("falls back to the validator address when no metadata name is available", () => {
    renderRow(stakeWithMeta(bondedStake));

    expect(screen.getByText("vote-acc-1")).toBeVisible();
  });

  it("falls back to a placeholder when the position has no validator at all", () => {
    renderRow(stakeWithMeta({ ...bondedStake, validatorAddress: "" }));

    expect(screen.getByText("-")).toBeVisible();
  });

  it("formats the delegated and withdrawable amounts with the account unit", () => {
    renderRow(stakeWithMeta(bondedStake));

    expect(screen.getByText("2 SOL")).toBeVisible();
    expect(screen.getByText("0.5 SOL")).toBeVisible();
  });

  it("shows a zero withdrawable amount when the position exposes none", () => {
    renderRow(stakeWithMeta({ ...bondedStake, withdrawableAmount: undefined }));

    expect(screen.getByText("0 SOL")).toBeVisible();
  });

  it("reports a zero active share when the position has no validator", () => {
    renderRow(stakeWithMeta({ ...bondedStake, validatorAddress: "" }));

    expect(screen.getByText("0 %")).toBeVisible();
  });

  it("renders the active share of a delegated position", () => {
    renderRow(
      stakeWithMeta({
        ...bondedStake,
        activeAmount: new BigNumber(1_000_000_000),
      }),
    );

    expect(screen.getByText("50.00 %")).toBeVisible();
  });

  describe("manage menu", () => {
    it("lists View details first, and opens the details instead of a legacy modal", async () => {
      const onManageAction = jest.fn();
      const onViewDetails = jest.fn();
      const item = stakeWithMeta(bondedStake);
      const { user } = renderRow(item, { onManageAction, onViewDetails });

      expect(menuItems()).toEqual(["View details", "Withdraw", "Deactivate"]);
      await user.click(screen.getByRole("menuitem", { name: "View details" }));

      expect(onViewDetails).toHaveBeenCalledWith(item);
      expect(onManageAction).not.toHaveBeenCalled();
    });

    it("lists no View details when the row cannot open them", () => {
      renderRow(stakeWithMeta(bondedStake));

      expect(menuItems()).toEqual(["Withdraw", "Deactivate"]);
    });

    it("keeps opening the legacy modal of every other action, Reactivate included", async () => {
      const onManageAction = jest.fn();
      const item = stakeWithMeta({
        positionId: "stake-acc-2",
        validatorAddress: "vote-acc-1",
        status: "deactivating",
        amount: new BigNumber(2_000_000_000),
        activeAmount: new BigNumber(0),
        withdrawableAmount: new BigNumber(0),
        completionDate: new Date(0),
      });
      const { user } = renderRow(item, { onManageAction, onViewDetails: jest.fn() });

      await user.click(screen.getByRole("menuitem", { name: "Reactivate" }));

      expect(onManageAction).toHaveBeenCalledWith(item, "MODAL_SOLANA_DELEGATION_REACTIVATE");
    });
  });
});
