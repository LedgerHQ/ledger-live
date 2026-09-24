import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

describe("CardAssetsManageRow", () => {
  afterEach(cleanup);

  it("should forward drag interactions from the asset row", () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    const onDragOver = jest.fn();
    const onDrop = jest.fn();

    render(
      <CardAssetsManageRow
        row={row}
        isReordering={false}
        isReorderDisabled={false}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
      />,
    );

    const handle = screen.getByRole("button", { name: "Drag USD Coin" });
    const assetRow = screen.getByTestId("card-asset-order-wallet-usdc");
    fireEvent.dragStart(handle);
    fireEvent.dragOver(assetRow);
    fireEvent.drop(assetRow);
    fireEvent.dragEnd(handle);

    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragOver).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it("should replace the dragged row handle with its progress spinner", () => {
    render(
      <CardAssetsManageRow
        row={row}
        isReordering
        isReorderDisabled
        onDragStart={jest.fn()}
        onDragEnd={jest.fn()}
        onDragOver={jest.fn()}
        onDrop={jest.fn()}
      />,
    );

    expect(screen.getByTestId("card-asset-reorder-spinner-wallet-usdc")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Drag USD Coin" })).not.toBeInTheDocument();
  });
});
