import React from "react";
import { render, screen } from "@tests/test-renderer";
import { TrackScreen } from "~/analytics";
import { PnlDetailDrawer } from "../components/PnlDetailDrawer";
import { PnlDetailItem } from "../components/PnlDetailDrawer/types";
import { PNL_DETAIL_PAGE } from "../const";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

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
    const ITEMS_WITHOUT_DEFINITION: PnlDetailItem[] = [{ title: "Bare row", value: "$50.00 USD" }];
    render(
      <PnlDetailDrawer isOpen onClose={jest.fn()} title={TITLE} items={ITEMS_WITHOUT_DEFINITION} />,
    );

    expect(screen.getByText("Bare row")).toBeVisible();
    expect(screen.getByText("$50.00 USD")).toBeVisible();
  });

  describe("TrackScreen", () => {
    beforeEach(() => mockedTrackScreen.mockClear());

    it("renders TrackScreen with pageName and source when open", () => {
      render(
        <PnlDetailDrawer
          isOpen
          onClose={jest.fn()}
          title={TITLE}
          pageName={PNL_DETAIL_PAGE}
          source="Analytics"
        />,
      );

      expect(mockedTrackScreen).toHaveBeenCalledWith(
        expect.objectContaining({ name: PNL_DETAIL_PAGE, source: "Analytics" }),
        undefined,
      );
    });

    it("does not render TrackScreen when closed", () => {
      render(
        <PnlDetailDrawer
          isOpen={false}
          onClose={jest.fn()}
          title={TITLE}
          pageName={PNL_DETAIL_PAGE}
          source="Analytics"
        />,
      );

      expect(mockedTrackScreen).not.toHaveBeenCalled();
    });

    it("does not render TrackScreen when pageName is not provided", () => {
      render(<PnlDetailDrawer isOpen onClose={jest.fn()} title={TITLE} />);

      expect(mockedTrackScreen).not.toHaveBeenCalled();
    });
  });
});
