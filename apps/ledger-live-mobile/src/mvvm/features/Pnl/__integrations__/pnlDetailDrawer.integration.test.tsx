import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PnlDetailDrawer } from "../components/PnlDetailDrawer";
import { PnlDetailItem } from "../components/PnlDetailDrawer/types";

const TITLE = "Profit & Loss";
const DESCRIPTION = "Lifetime metrics for your portfolio.";

const ITEMS: PnlDetailItem[] = [
  {
    title: "Total return",
    value: "$1,200.00 USD",
    definition: "Realised + unrealised gains since first inflow.",
  },
  {
    title: "Unrealised return",
    value: "$900.00 USD",
    definition: "Mark-to-market on coins you still hold.",
  },
  {
    title: "Realised return",
    value: "$300.00 USD",
    definition: "Gains booked through past sells.",
  },
];

describe("PnlDetailDrawer integration", () => {
  it("renders the header and every detail row when open", () => {
    render(
      <PnlDetailDrawer
        isOpen
        onClose={jest.fn()}
        title={TITLE}
        description={DESCRIPTION}
        items={ITEMS}
      />,
    );

    expect(screen.getByText(TITLE)).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
    for (const item of ITEMS) {
      expect(screen.getByText(item.title)).toBeVisible();
      expect(screen.getByText(item.value)).toBeVisible();
      if (item.definition) {
        expect(screen.getByText(item.definition)).toBeVisible();
      }
    }
  });

  it("renders bodyText below the header for header-only drawers", () => {
    const BODY = "The total amount you paid to acquire your current holdings, including fees.";
    render(<PnlDetailDrawer isOpen onClose={jest.fn()} title="Cost basis" bodyText={BODY} />);

    expect(screen.getByText("Cost basis")).toBeVisible();
    expect(screen.getByText(BODY)).toBeVisible();
  });

  it("renders rows without a definition", () => {
    const ITEMS_WITHOUT_DEFINITION: PnlDetailItem[] = [
      { title: "Bare row", value: "$50.00 USD" },
    ];
    render(
      <PnlDetailDrawer
        isOpen
        onClose={jest.fn()}
        title={TITLE}
        items={ITEMS_WITHOUT_DEFINITION}
      />,
    );

    expect(screen.getByText("Bare row")).toBeVisible();
    expect(screen.getByText("$50.00 USD")).toBeVisible();
  });
});
