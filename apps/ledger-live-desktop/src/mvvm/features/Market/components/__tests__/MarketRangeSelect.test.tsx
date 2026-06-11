import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { MarketRangeSelect } from "../MarketRangeSelect";

const options = [
  { value: "24h", label: "1 day" },
  { value: "7d", label: "1 week" },
  { value: "30d", label: "1 month" },
  { value: "1y", label: "1 year" },
];

describe("MarketRangeSelect", () => {
  it("renders the selected range label in the trigger", () => {
    render(<MarketRangeSelect options={options} value={options[0]} onChange={jest.fn()} />);

    expect(screen.getByTestId("market-range-select")).toHaveTextContent("1 day");
  });

  it("opens the menu and renders every range option", async () => {
    const { user } = render(
      <MarketRangeSelect options={options} value={options[0]} onChange={jest.fn()} />,
    );

    await user.click(screen.getByTestId("market-range-select"));

    for (const option of options) {
      expect(await screen.findByRole("option", { name: option.label })).toBeVisible();
    }
  });
});
