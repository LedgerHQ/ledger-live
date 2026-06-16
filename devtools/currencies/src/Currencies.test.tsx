import { render, screen } from "@testing-library/react";
import { FIAT_CURRENCIES_REGISTRY } from "@domain/entity-currency-fiat";
import Currencies from "./Currencies";

describe("Currencies", () => {
  it("renders the supported fiats and count", () => {
    render(
      <Currencies
        supportedFiats={[FIAT_CURRENCIES_REGISTRY.usd]}
        isFetching={false}
        refetch={() => {}}
      />,
    );
    expect(screen.getByText("1 supported fiats")).toBeVisible();
    expect(screen.getByText("USD")).toBeVisible();
  });

  it("renders an error when provided", () => {
    render(<Currencies supportedFiats={[]} isFetching={false} error="boom" refetch={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });
});
