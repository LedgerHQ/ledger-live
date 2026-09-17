import { render, screen, fireEvent } from "@support/jest-devtools/web";
import { ByCurrencyTab } from "./ByCurrencyTab";
import type { ByCurrencySectionViewModel } from "../hooks/useByCurrencySectionViewModel";
import type { CryptoCurrency } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: ({ ticker }: { ticker: string }) => <span data-testid={`icon-${ticker}`} />,
}));

const BTC = { id: "bitcoin", name: "Bitcoin", ticker: "BTC" } as CryptoCurrency;
const ETH = { id: "ethereum", name: "Ethereum", ticker: "ETH" } as CryptoCurrency;

function makeVm(overrides: Partial<ByCurrencySectionViewModel> = {}): ByCurrencySectionViewModel {
  return {
    currencySearch: "",
    setCurrencySearch: jest.fn(),
    tokenInput: "",
    setTokenInput: jest.fn(),
    accountsPerCurrency: 1,
    setAccountsPerCurrency: jest.fn(),
    filteredCurrencies: [BTC, ETH],
    selectedIds: new Set(),
    selectedCount: 0,
    totalAccounts: 0,
    toggleCurrency: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    handleByCurrency: jest.fn(),
    handleGenerateEmpty: jest.fn(),
    ...overrides,
  };
}

describe("ByCurrencyTab", () => {
  it("renders each currency name and ticker in the list", () => {
    render(<ByCurrencyTab vm={makeVm()} />);
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
  });

  it("renders a CryptoIcon for each currency", () => {
    render(<ByCurrencyTab vm={makeVm()} />);
    expect(screen.getByTestId("icon-BTC")).toBeInTheDocument();
    expect(screen.getByTestId("icon-ETH")).toBeInTheDocument();
  });

  it("calls vm.toggleCurrency when a currency row is clicked", () => {
    const toggleCurrency = jest.fn();
    render(<ByCurrencyTab vm={makeVm({ toggleCurrency })} />);
    fireEvent.click(screen.getByText("Bitcoin"));
    expect(toggleCurrency).toHaveBeenCalledWith("bitcoin");
  });

  it("calls vm.selectAll when Select all is clicked", () => {
    const selectAll = jest.fn();
    render(<ByCurrencyTab vm={makeVm({ selectAll })} />);
    fireEvent.click(screen.getByText("Select all"));
    expect(selectAll).toHaveBeenCalledTimes(1);
  });

  it("shows Clear button and calls vm.clearSelection when selection is non-empty", () => {
    const clearSelection = jest.fn();
    render(
      <ByCurrencyTab
        vm={makeVm({ selectedCount: 1, selectedIds: new Set(["bitcoin"]), clearSelection })}
      />,
    );
    fireEvent.click(screen.getByText("Clear"));
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });

  it("hides the Clear button when nothing is selected", () => {
    render(<ByCurrencyTab vm={makeVm({ selectedCount: 0 })} />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("generate buttons are disabled when selectedCount is 0", () => {
    render(<ByCurrencyTab vm={makeVm({ selectedCount: 0 })} />);
    expect(screen.getByRole("button", { name: /generate with history/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /generate empty/i })).toBeDisabled();
  });

  it("generate buttons are enabled when at least one currency is selected", () => {
    render(<ByCurrencyTab vm={makeVm({ selectedCount: 1, selectedIds: new Set(["bitcoin"]) })} />);
    expect(screen.getByRole("button", { name: /generate with history/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /generate empty/i })).not.toBeDisabled();
  });

  it("shows account count when selection is non-empty", () => {
    render(<ByCurrencyTab vm={makeVm({ selectedCount: 2, totalAccounts: 10 })} />);
    expect(screen.getByText("10 accounts will be generated")).toBeInTheDocument();
  });

  it("shows 'No currencies match' when filteredCurrencies is empty", () => {
    render(<ByCurrencyTab vm={makeVm({ filteredCurrencies: [] })} />);
    expect(screen.getByText("No currencies match.")).toBeInTheDocument();
  });

  it("calls vm.handleByCurrency when Generate with history is clicked", () => {
    const handleByCurrency = jest.fn();
    render(
      <ByCurrencyTab
        vm={makeVm({ selectedCount: 1, selectedIds: new Set(["bitcoin"]), handleByCurrency })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /generate with history/i }));
    expect(handleByCurrency).toHaveBeenCalledTimes(1);
  });

  it("calls vm.handleGenerateEmpty when Generate empty is clicked", () => {
    const handleGenerateEmpty = jest.fn();
    render(
      <ByCurrencyTab
        vm={makeVm({ selectedCount: 1, selectedIds: new Set(["bitcoin"]), handleGenerateEmpty })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /generate empty/i }));
    expect(handleGenerateEmpty).toHaveBeenCalledTimes(1);
  });
});
