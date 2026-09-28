import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { CardAssetsManageRow } from "../CardAssetsManageRow.web";

const row = {
  id: "wallet-usdc",
  addressId: "address-usdc",
  currency: "usdc",
  network: "ethereum",
  name: "USD Coin",
  ticker: "USDC",
  ledgerId: "ethereum/erc20/usd__coin",
  cryptoAmount: "125.40 USDC",
  countervalue: "$125.40",
  countervalueAmount: 125.4,
};

function renderRow(props: Partial<React.ComponentProps<typeof CardAssetsManageRow>> = {}) {
  return render(
    <DndContext>
      <SortableContext items={[row.id]}>
        <CardAssetsManageRow
          row={row}
          showHandle
          isReordering={false}
          reorderLabel="Reorder USD Coin"
          {...props}
        />
      </SortableContext>
    </DndContext>,
  );
}

describe("CardAssetsManageRow", () => {
  afterEach(cleanup);

  it("should show a drag handle labeled for the asset", () => {
    renderRow();

    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reorder USD Coin" })).toBeVisible();
  });

  it("should hide the handle for a single-asset list", () => {
    renderRow({ showHandle: false });

    expect(screen.queryByRole("button", { name: "Reorder USD Coin" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-asset-reorder-spinner-wallet-usdc")).not.toBeInTheDocument();
  });

  it("should replace the dragged row handle with its progress spinner", () => {
    renderRow({ isReordering: true });

    expect(screen.getByTestId("card-asset-reorder-spinner-wallet-usdc")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Reorder USD Coin" })).not.toBeInTheDocument();
  });
});
