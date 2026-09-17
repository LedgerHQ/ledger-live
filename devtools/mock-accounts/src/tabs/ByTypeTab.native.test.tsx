import { render, screen, userEvent } from "@support/jest-devtools/native";
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

describe("ByTypeTab (native)", () => {
  it("renders all four type labels", () => {
    render(<ByTypeTab vm={makeVm()} stocksLoading={false} stablecoinsLoading={false} />);
    expect(screen.getAllByText("Cryptos")[0]).toBeOnTheScreen();
    expect(screen.getAllByText("Stablecoins")[0]).toBeOnTheScreen();
    expect(screen.getAllByText("Stocks")[0]).toBeOnTheScreen();
    expect(screen.getAllByText("Testnets")[0]).toBeOnTheScreen();
  });

  it("shows validation error when vm.isValid is false", () => {
    render(
      <ByTypeTab
        vm={makeVm({ isValid: false, isReady: false })}
        stocksLoading={false}
        stablecoinsLoading={false}
      />,
    );
    expect(screen.getAllByText("Select at least one account type.")[0]).toBeOnTheScreen();
  });

  it("shows stablecoin loading message when stablecoins are included and loading", () => {
    render(<ByTypeTab vm={makeVm()} stocksLoading={false} stablecoinsLoading={true} />);
    expect(screen.getAllByText("Loading stablecoin data…")[0]).toBeOnTheScreen();
  });

  it("calls vm.onGenerate when the generate button is pressed", async () => {
    const onGenerate = jest.fn();
    const user = userEvent.setup();
    render(
      <ByTypeTab vm={makeVm({ onGenerate })} stocksLoading={false} stablecoinsLoading={false} />,
    );
    await user.press(screen.getAllByText("Generate by type")[0]);
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});
