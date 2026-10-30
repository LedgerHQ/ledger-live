import React, { isValidElement } from "react";
import { render, renderHook } from "@testing-library/react";
import { mockCryptoCurrency } from "@domain/entity-currency-crypto/schema.mock";
import type { CellContext, HeaderContext } from "@tanstack/react-table";
import { useAssetsTablePorts } from "./assetsTablePorts";
import { AssetsTablePortsMissing } from "./errors";
import { mockAssetsTablePorts, PortsWrapper } from "./testing/mockAssetsTablePorts";
import type { AssetTableItem } from "./types";
import { useAssetsTable } from "./useAssetsTable";

jest.mock("@features/platform-market-countervalues", () => ({
  __esModule: true,
  useCalculate: () => undefined,
}));

jest.mock("@shared/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "assets.columns.name": "Name",
        "assets.columns.price": "Price",
        "assets.columns.balance": "Balance",
        "assets.columns.value": "Value",
        "assets.columns.trend": "1D Trend",
        "assets.columns.trendTooltip": "Changes to your balance in the last 24 hours.",
      })[key] ?? key,
  }),
}));

function ColumnLabel({
  text,
  as = "div",
}: {
  readonly text: string;
  readonly as?: "div" | "span";
}) {
  const Tag = as;
  return <Tag>{text}</Tag>;
}

const bitcoin = mockCryptoCurrency();

function asset(overrides: Partial<AssetTableItem> = {}): AssetTableItem {
  return {
    currency: bitcoin,
    balance: 1,
    value: 100,
    distribution: 1,
    accounts: [{ id: "account" }],
    isPlaceholder: false,
    ...overrides,
  };
}

function renderTable(options?: Parameters<typeof useAssetsTable>[1]) {
  const ports = mockAssetsTablePorts({ TruncatedText: ColumnLabel });
  return {
    ports,
    ...renderHook(() => useAssetsTable([], options), {
      wrapper: ({ children }) => <PortsWrapper ports={ports}>{children}</PortsWrapper>,
    }),
  };
}

function cellElement(
  table: ReturnType<typeof useAssetsTable>,
  columnId: string,
  item: AssetTableItem,
) {
  const cell = table.getAllColumns().find(column => column.id === columnId)?.columnDef.cell;
  if (typeof cell !== "function") {
    throw new Error(`missing cell for ${columnId}`);
  }
  return cell({ row: { original: item } } as CellContext<AssetTableItem, unknown>);
}

describe("useAssetsTablePorts", () => {
  it("throws when the provider is missing", () => {
    expect(() => renderHook(() => useAssetsTablePorts())).toThrow(AssetsTablePortsMissing);
  });
});

describe("useAssetsTable", () => {
  it("omits trend header tooltip meta when showTrendColumnTooltip is false", () => {
    const { result } = renderTable({ showTrendColumnTooltip: false });
    const trendCol = result.current.getAllColumns().find(column => column.id === "trend");
    expect(trendCol?.columnDef.meta?.headerTrailingContent).toBeUndefined();
  });

  it("includes trend header tooltip meta by default", () => {
    const { result } = renderTable();
    const trendCol = result.current.getAllColumns().find(column => column.id === "trend");
    expect(trendCol?.columnDef.meta?.headerTrailingContent).toBeDefined();
  });

  it("shows the price column by default", () => {
    const { result } = renderTable();

    expect(result.current.getColumn("price")?.getIsVisible()).toBe(true);
  });

  it("hides the price column when showPriceColumn is false", () => {
    const { result } = renderTable({ showPriceColumn: false });

    expect(result.current.getColumn("price")?.getIsVisible()).toBe(false);
    expect(result.current.getVisibleLeafColumns().map(({ id }) => id)).toEqual([
      "currency",
      "balance",
      "value",
      "trend",
    ]);
  });

  it("exposes the full trend column label", () => {
    const { result } = renderTable();
    const header = result.current.getAllColumns().find(column => column.id === "trend")
      ?.columnDef.header;

    expect(typeof header).toBe("function");
    if (typeof header !== "function") return;

    const element = header({} as HeaderContext<AssetTableItem, unknown>);

    expect(isValidElement(element) && element.type === ColumnLabel).toBe(true);
    expect(isValidElement(element) && element.props).toMatchObject({
      as: "span",
      text: "1D Trend",
    });
  });

  it("renders a held asset and a placeholder", () => {
    const { result, ports } = renderTable();
    const held = asset({ marketPrice: 43_000, trend: 0.023 });
    const placeholder = asset({ isPlaceholder: true, accounts: [], balance: 0, value: 0 });
    const cell = (columnId: string, item: AssetTableItem) =>
      cellElement(result.current, columnId, item);

    const nameCell = cell("currency", held);
    expect(isValidElement(nameCell) && nameCell.props).toMatchObject({
      "data-testid": "w40-asset-row-bitcoin-bitcoin",
    });

    const screen = render(
      <PortsWrapper ports={ports}>
        {cell("price", held)}
        {cell("balance", held)}
        {cell("value", held)}
        {cell("trend", held)}
        {cell("value", placeholder)}
        {cell("trend", placeholder)}
      </PortsWrapper>,
    );

    expect(screen.getByText("+2.30%")).toBeTruthy();
    expect(screen.getByText("0.00%")).toBeTruthy();
    expect(screen.getAllByTestId("w40-asset-row-value-bitcoin-bitcoin")).toHaveLength(2);
  });
});
