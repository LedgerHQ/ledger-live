import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { AppGeoBlocker } from "../index";
import { useOFACGeoBlockCheck } from "@ledgerhq/live-common/hooks/useOFACGeoBlockCheck";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

jest.mock("@ledgerhq/live-common/hooks/useOFACGeoBlockCheck", () => ({
  useOFACGeoBlockCheck: jest.fn(),
}));
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/config/urls", () => ({
  urls: { geoBlock: { learnMore: "https://test/learn-more" } },
}));

describe("AppGeoBlocker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when not blocked", () => {
    (useOFACGeoBlockCheck as jest.Mock).mockReturnValue({ blocked: false });
    render(
      <AppGeoBlocker>
        <div data-testid="child">Visible</div>
      </AppGeoBlocker>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders geoblocking UI when blocked", () => {
    (useOFACGeoBlockCheck as jest.Mock).mockReturnValue({ blocked: true });
    render(
      <AppGeoBlocker>
        <div data-testid="child">Should not be visible</div>
      </AppGeoBlocker>,
    );
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByText(/Location unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ledger wallet is not available in this location./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Learn more/i)).toBeInTheDocument();
  });

  it("calls openURL with correct URL when Learn More link is clicked", () => {
    (useOFACGeoBlockCheck as jest.Mock).mockReturnValue({ blocked: true });
    render(
      <AppGeoBlocker>
        <div>child</div>
      </AppGeoBlocker>,
    );
    const learnMoreLink = screen.getByText(/Learn more/i);
    fireEvent.click(learnMoreLink);
    expect(openURL).toHaveBeenCalledWith(urls.geoBlock.learnMore);
  });

  it("calls window.api.appLoaded on finish if window.api exists", () => {
    const appLoaded = jest.fn();
    window.api = {
      appDirname: "",
      appLoaded,
      reloadRenderer: jest.fn(),
      openWindow: jest.fn(),
    };
    let onFinish: () => void = () => {};
    (useOFACGeoBlockCheck as jest.Mock).mockImplementation(({ onFinish: cb }) => {
      onFinish = cb;
      return { blocked: false };
    });
    render(
      <AppGeoBlocker>
        <div>child</div>
      </AppGeoBlocker>,
    );
    onFinish();
    expect(appLoaded).toHaveBeenCalled();
  });

  it("does not throw if window.api is undefined", () => {
    (useOFACGeoBlockCheck as jest.Mock).mockImplementation(({ onFinish }) => {
      if (onFinish) onFinish();
      return { blocked: false };
    });
    expect(() =>
      render(
        <AppGeoBlocker>
          <div>child</div>
        </AppGeoBlocker>,
      ),
    ).not.toThrow();
  });

  it("renders nothing if children is null and not blocked", () => {
    (useOFACGeoBlockCheck as jest.Mock).mockReturnValue({ blocked: false });
    const { container } = render(<AppGeoBlocker>{null}</AppGeoBlocker>);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders custom children when not blocked", () => {
    (useOFACGeoBlockCheck as jest.Mock).mockReturnValue({ blocked: false });
    render(
      <AppGeoBlocker>
        <span>Custom Content</span>
      </AppGeoBlocker>,
    );
    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });
});
