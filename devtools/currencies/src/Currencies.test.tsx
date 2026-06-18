import { render, screen } from "@testing-library/react";
import { FIAT_CURRENCIES_REGISTRY } from "@domain/entity-currency-fiat";
import Currencies from "./Currencies";

describe("Currencies", () => {
  it("renders the supported fiats and count", () => {
    render(
      <Currencies
        supportedFiats={[FIAT_CURRENCIES_REGISTRY.usd]}
        status={{ type: "idle" }}
        refetch={() => {}}
      />,
    );
    expect(screen.getByText("1 supported fiats")).toBeVisible();
    expect(screen.getByText("USD")).toBeVisible();
  });

  it("renders an error when the status is error", () => {
    render(
      <Currencies
        supportedFiats={[]}
        status={{ type: "error", message: "boom" }}
        refetch={() => {}}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });
});
