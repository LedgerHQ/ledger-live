import React from "react";
import { render, screen } from "tests/testSetup";
import { PnLinfoDetail } from "../PnLinfoDetail";
import type { PnlDetailItem } from "../types";

const TITLE = "Realised return";
const DESCRIPTION = "Estimated gain or loss on your current holdings.";
const VALUE = "$243.32";

const makeProps = (overrides: Partial<PnlDetailItem> = {}): PnlDetailItem => ({
  title: TITLE,
  description: DESCRIPTION,
  value: VALUE,
  ...overrides,
});

describe("PnLinfoDetail", () => {
  it("renders the title, description and value", () => {
    render(<PnLinfoDetail {...makeProps()} />);

    expect(screen.getByText(TITLE)).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
    expect(screen.getByText(VALUE)).toBeVisible();
  });

  it("renders the percentage evolution with the Lumen Trend component when provided", () => {
    render(<PnLinfoDetail {...makeProps({ percentage: 3 })} />);

    expect(screen.getByText("3.00%")).toBeVisible();
    expect(screen.getByText("3.00%")).toHaveClass("text-success");
  });

  it("masks the percentage in discreet mode", () => {
    render(<PnLinfoDetail {...makeProps({ percentage: 3 })} />, {
      initialState: { settings: { discreetMode: true } },
    });

    expect(screen.getByText("***")).toBeVisible();
    expect(screen.getByText("***")).toHaveClass("self-end");
    expect(screen.queryByText("3.00%")).not.toBeInTheDocument();
  });
});
