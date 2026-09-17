import { render, screen, fireEvent } from "@support/jest-devtools/web";
import { ByTypeTab } from "./ByTypeTab";
import type { ByTypeSectionViewModel } from "../hooks/useByTypeSectionViewModel";

function makeVm(overrides: Partial<ByTypeSectionViewModel> = {}): ByTypeSectionViewModel {
  return {
    includeCryptos: true,
    includeStablecoins: true,
    includeStocks: true,
    includeTestnet: false,
    countInput: "10",
    isValid: true,
    isReady: true,
    onToggleCryptos: jest.fn(),
    setIncludeStablecoins: jest.fn(),
    setIncludeStocks: jest.fn(),
    onToggleTestnet: jest.fn(),
    setCountInput: jest.fn(),
    onGenerate: jest.fn(),
    ...overrides,
  };
}

describe("ByTypeTab", () => {
  it("renders all four type labels", () => {
    render(<ByTypeTab vm={makeVm()} stocksLoading={false} stablecoinsLoading={false} />);
    expect(screen.getByText("Cryptos")).toBeInTheDocument();
    expect(screen.getByText("Stablecoins")).toBeInTheDocument();
    expect(screen.getByText("Stocks")).toBeInTheDocument();
    expect(screen.getByText("Testnets")).toBeInTheDocument();
  });

  it("generate button is disabled when vm.isReady is false", () => {
    render(
      <ByTypeTab
        vm={makeVm({ isReady: false })}
        stocksLoading={false}
        stablecoinsLoading={false}
      />,
    );
    expect(screen.getByRole("button", { name: /generate by type/i })).toBeDisabled();
  });

  it("shows validation error when vm.isValid is false", () => {
    render(
      <ByTypeTab
        vm={makeVm({ isValid: false, isReady: false })}
        stocksLoading={false}
        stablecoinsLoading={false}
      />,
    );
    expect(screen.getByText("Select at least one account type.")).toBeInTheDocument();
  });

  it("shows stablecoin loading message when stablecoins are included and loading", () => {
    render(<ByTypeTab vm={makeVm()} stocksLoading={false} stablecoinsLoading={true} />);
    expect(screen.getByText("Loading stablecoin data…")).toBeInTheDocument();
  });

  it("shows stock loading message when stocks are included and loading", () => {
    render(<ByTypeTab vm={makeVm()} stocksLoading={true} stablecoinsLoading={false} />);
    expect(screen.getByText("Loading stock data…")).toBeInTheDocument();
  });

  it("does not show loading messages when the relevant type is not included", () => {
    render(
      <ByTypeTab
        vm={makeVm({ includeStablecoins: false, includeStocks: false })}
        stocksLoading={true}
        stablecoinsLoading={true}
      />,
    );
    expect(screen.queryByText("Loading stablecoin data…")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading stock data…")).not.toBeInTheDocument();
  });

  it("calls vm.onGenerate when the generate button is clicked", () => {
    const onGenerate = jest.fn();
    render(
      <ByTypeTab vm={makeVm({ onGenerate })} stocksLoading={false} stablecoinsLoading={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /generate by type/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});
