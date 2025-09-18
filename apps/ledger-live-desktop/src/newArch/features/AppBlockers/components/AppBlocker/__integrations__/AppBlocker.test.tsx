import React from "react";
import { render, screen } from "tests/testSetup";
import { AppBlocker } from "../index";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/config/urls", () => ({
  urls: { geoBlock: { learnMore: "https://test/learn-more" } },
}));

describe("AppBlocker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when not blocked", () => {
    render(
      <AppBlocker
        blocked={false}
        DescriptionComponent={() => null}
        IconComponent={() => null}
        TitleComponent={() => null}
        CTAComponent={() => null}
      >
        <div data-testid="child">Visible</div>
      </AppBlocker>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders UI when blocked", () => {
    render(
      <AppBlocker
        blocked
        TitleComponent={() => <span>Location unavailable</span>}
        IconComponent={() => null}
        DescriptionComponent={() => <span>Ledger wallet is not available in this location.</span>}
        CTAComponent={() => <button>Learn more</button>}
      >
        <div data-testid="child">Should not be visible</div>
      </AppBlocker>,
    );
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByText(/Location unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ledger wallet is not available in this location./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Learn more/i)).toBeInTheDocument();
  });

  it("renders nothing if children is null and not blocked", () => {
    const { container } = render(
      <AppBlocker
        blocked={false}
        TitleComponent={() => null}
        DescriptionComponent={() => null}
        CTAComponent={() => null}
        IconComponent={() => null}
      >
        {null}
      </AppBlocker>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders custom children when not blocked", () => {
    render(
      <AppBlocker
        blocked={false}
        TitleComponent={() => null}
        DescriptionComponent={() => null}
        CTAComponent={() => null}
        IconComponent={() => null}
      >
        <span>Custom Content</span>
      </AppBlocker>,
    );
    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });
});
