import { fireEvent, render, screen } from "@support/jest/devtools/native";
import { CoinConfig } from "./CoinConfig";
import { COUNTERVALUES_KEY, ETH_KEY, SOLANA_KEY, createTestHost } from "./testHost";

describe("CoinConfig (native)", () => {
  it("should list the coin config keys, then every key on the All filter", () => {
    renderCoinConfig();

    expect(screen.getByText(SOLANA_KEY)).toBeOnTheScreen();
    expect(screen.queryByText(COUNTERVALUES_KEY)).not.toBeOnTheScreen();

    fireEvent.press(screen.getByText("All 3"));

    expect(screen.getByText(COUNTERVALUES_KEY)).toBeOnTheScreen();
  });

  it("should search the keys of the active filter", () => {
    renderCoinConfig();

    fireEvent.changeText(screen.getByPlaceholderText("Search config keys..."), "solana");

    expect(screen.getByText(SOLANA_KEY)).toBeOnTheScreen();
    expect(screen.queryByText(ETH_KEY)).not.toBeOnTheScreen();
  });

  it("should show how many keys are listed and overridden", () => {
    renderCoinConfig({ [SOLANA_KEY]: { token2022Enabled: true } });

    expect(screen.getByText("2 of 3")).toBeOnTheScreen();
    expect(screen.getByText("1 overridden")).toBeOnTheScreen();
    expect(screen.getAllByText("Overridden")).toHaveLength(1);
  });
});

function renderCoinConfig(initialOverrides?: Record<string, unknown>) {
  const { Host, spies } = createTestHost(CoinConfig);
  render(<Host initialOverrides={initialOverrides} />);
  return { spies };
}
