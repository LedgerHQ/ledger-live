import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PnlDetailRow } from "../PnlDetailRow";
import type { PnlDetailItem } from "../types";

const TITLE = "Unrealised return";
const DEFINITION = "The estimated profit or loss if sold at current price.";
const VALUE = "+ $243.32";

const makeItem = (overrides: Partial<PnlDetailItem> = {}): PnlDetailItem => ({
  title: TITLE,
  value: VALUE,
  definition: DEFINITION,
  ...overrides,
});

describe("PnlDetailRow", () => {
  it("renders the title, definition and value", () => {
    render(<PnlDetailRow item={makeItem()} />);

    expect(screen.getByText(TITLE)).toBeVisible();
    expect(screen.getByText(DEFINITION)).toBeVisible();
    expect(screen.getByText(VALUE)).toBeVisible();
  });

  it("renders the percentage evolution with the Lumen Trend component when provided", () => {
    render(<PnlDetailRow item={makeItem({ percentage: 3 })} />);

    expect(screen.getByText("3.00%")).toBeVisible();
  });

  it("masks the percentage in discreet mode", () => {
    render(<PnlDetailRow item={makeItem({ percentage: 3 })} discreet />);

    expect(screen.getByText("***")).toBeVisible();
    expect(screen.queryByText("3.00%")).toBeNull();
  });
});
