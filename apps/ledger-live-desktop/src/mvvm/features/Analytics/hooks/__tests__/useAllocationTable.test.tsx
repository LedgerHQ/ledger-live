import React from "react";
import { render, screen } from "tests/testSetup";
import { useAllocationTable } from "../useAllocationTable";
import { DataTable, DataTableRoot } from "@ledgerhq/lumen-ui-react";
import type { AllocationTableItem } from "../../types";
import { allocationItems } from "../../__fixtures__/allocationFixtures";

jest.mock("../../../Assets/components/Cells/BalanceCell", () => ({
  BalanceCell: ({ balance }: { balance: number }) => (
    <span data-testid="balance-cell">{balance}</span>
  ),
}));

jest.mock("../../../Assets/components/Cells/CounterValueCell", () => ({
  CounterValueCell: () => <span data-testid="counter-value-cell">CV</span>,
}));

jest.mock("~/renderer/components/CryptoCurrencyIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="crypto-icon" />,
}));

const items: AllocationTableItem[] = [
  allocationItems[0],
  { ...allocationItems[1], distribution: 30.55 },
];

function TableWrapper({ data }: { readonly data: AllocationTableItem[] }) {
  const table = useAllocationTable(data);
  return (
    <DataTableRoot table={table} appearance="plain">
      <DataTable />
    </DataTableRoot>
  );
}

describe("useAllocationTable", () => {
  it("should render all column headers", () => {
    render(<TableWrapper data={items} />);

    expect(screen.getByText("Name")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByText("Value")).toBeVisible();
    expect(screen.getByText("Allocation")).toBeVisible();
  });

  it("should render currency name and ticker for each row", () => {
    render(<TableWrapper data={items} />);

    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
    expect(screen.getByText("Ethereum")).toBeVisible();
    expect(screen.getByText("ETH")).toBeVisible();
  });

  it("should render a crypto icon for each row", () => {
    render(<TableWrapper data={items} />);

    expect(screen.getAllByTestId("crypto-icon")).toHaveLength(2);
  });

  it("should render BalanceCell for each row", () => {
    render(<TableWrapper data={items} />);

    const cells = screen.getAllByTestId("balance-cell");
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent("100000");
    expect(cells[1]).toHaveTextContent("50000");
  });

  it("should render CounterValueCell for each row", () => {
    render(<TableWrapper data={items} />);

    expect(screen.getAllByTestId("counter-value-cell")).toHaveLength(2);
  });

  it("should format distribution percentages", () => {
    render(<TableWrapper data={items} />);

    expect(screen.getByText("60%")).toBeVisible();
    expect(screen.getByText("30.55%")).toBeVisible();
  });

  it("should render an empty table when no items are provided", () => {
    render(<TableWrapper data={[]} />);

    expect(screen.getByText("Name")).toBeVisible();
    expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
  });
});
