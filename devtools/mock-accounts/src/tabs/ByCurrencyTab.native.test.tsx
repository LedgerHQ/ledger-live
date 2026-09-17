import { render, screen, userEvent } from "@support/jest-devtools/native";
import { ByCurrencyTab } from "./ByCurrencyTab";
import type { ByCurrencySectionViewModel } from "../hooks/useByCurrencySectionViewModel";
import type { CryptoCurrency } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/crypto-icons/native", () => ({
  __esModule: true,
  default: ({ ticker }: { ticker: string }) => null,
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

describe("ByCurrencyTab (native)", () => {
  it("renders each currency name in the list", () => {
    render(<ByCurrencyTab vm={makeVm()} />);
    expect(screen.getAllByText("Bitcoin")[0]).toBeOnTheScreen();
    expect(screen.getAllByText("Ethereum")[0]).toBeOnTheScreen();
  });

  it("calls vm.selectAll when Select all is pressed", async () => {
    const selectAll = jest.fn();
    const user = userEvent.setup();
    render(<ByCurrencyTab vm={makeVm({ selectAll })} />);
    await user.press(screen.getAllByText("Select all")[0]);
    expect(selectAll).toHaveBeenCalledTimes(1);
  });

  it("shows Clear button when selection is non-empty", () => {
    render(<ByCurrencyTab vm={makeVm({ selectedCount: 1, selectedIds: new Set(["bitcoin"]) })} />);
    expect(screen.getAllByText("Clear")[0]).toBeOnTheScreen();
  });

  it("shows 'No currencies match' when filteredCurrencies is empty", () => {
    render(<ByCurrencyTab vm={makeVm({ filteredCurrencies: [] })} />);
    expect(screen.getAllByText("No currencies match.")[0]).toBeOnTheScreen();
  });

  it("calls vm.handleByCurrency when Generate with history is pressed", async () => {
    const handleByCurrency = jest.fn();
    const user = userEvent.setup();
    render(
      <ByCurrencyTab
        vm={makeVm({ selectedCount: 1, selectedIds: new Set(["bitcoin"]), handleByCurrency })}
      />,
    );
    await user.press(screen.getAllByText("Generate with history")[0]);
    expect(handleByCurrency).toHaveBeenCalledTimes(1);
  });
});
