import React from "react";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
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

const withDiscreet =
  (discreetMode: boolean) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, discreetMode },
  });

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

    expect(screen.getByText(TITLE)).toBeOnTheScreen();
    expect(screen.getByText(DESCRIPTION)).toBeOnTheScreen();
    for (const item of ITEMS) {
      expect(screen.getByText(item.title)).toBeOnTheScreen();
      expect(screen.getByText(item.value)).toBeOnTheScreen();
      if (item.definition) {
        expect(screen.getByText(item.definition)).toBeOnTheScreen();
      }
    }
  });

  it("masks every value when discreet mode is on", () => {
    render(<PnlDetailDrawer isOpen onClose={jest.fn()} title={TITLE} items={ITEMS} />, {
      overrideInitialState: withDiscreet(true),
    });

    expect(screen.getAllByText("***")).toHaveLength(ITEMS.length);
    for (const item of ITEMS) {
      expect(screen.queryByText(item.value)).toBeNull();
    }
  });

  it("shows real values when discreet mode is off", () => {
    render(<PnlDetailDrawer isOpen onClose={jest.fn()} title={TITLE} items={ITEMS} />, {
      overrideInitialState: withDiscreet(false),
    });

    for (const item of ITEMS) {
      expect(screen.getByText(item.value)).toBeOnTheScreen();
    }
    expect(screen.queryByText("***")).toBeNull();
  });

  it("renders bodyText below the header for header-only drawers", () => {
    const BODY = "The total amount you paid to acquire your current holdings, including fees.";
    render(<PnlDetailDrawer isOpen onClose={jest.fn()} title="Cost basis" bodyText={BODY} />);

    expect(screen.getByText("Cost basis")).toBeOnTheScreen();
    expect(screen.getByText(BODY)).toBeOnTheScreen();
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

    expect(screen.getByText("Bare row")).toBeOnTheScreen();
    expect(screen.getByText("$50.00 USD")).toBeOnTheScreen();
  });
});
