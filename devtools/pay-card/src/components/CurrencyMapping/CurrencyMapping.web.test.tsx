import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyMappingScreen } from "./CurrencyMapping";

const rows = [
  { key: "btc.bitcoin", ledgerId: "bitcoin" },
  { key: "usdc.ethereum", ledgerId: "ethereum/erc20/usd__coin" },
];

describe("CurrencyMapping (web)", () => {
  it("lists every pair with the currency it resolves to", () => {
    render(<CurrencyMappingScreen rows={rows} onBack={jest.fn()} />);

    expect(screen.getByText("currency.network")).toBeInTheDocument();
    expect(screen.getByText("btc.bitcoin")).toBeInTheDocument();
    expect(screen.getByText("bitcoin")).toBeInTheDocument();
    expect(screen.getByText("usdc.ethereum")).toBeInTheDocument();
    expect(screen.getByText("ethereum/erc20/usd__coin")).toBeInTheDocument();
  });

  it("counts the pairs, so a missing one is read against the whole catalog", () => {
    render(<CurrencyMappingScreen rows={rows} onBack={jest.fn()} />);

    expect(screen.getByText(/^2 pairs\./)).toBeInTheDocument();
  });

  it("returns to the tool", () => {
    const onBack = jest.fn();
    render(<CurrencyMappingScreen rows={rows} onBack={onBack} />);

    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
