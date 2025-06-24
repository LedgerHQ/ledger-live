import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { AppVersionBlocker } from "../index";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useAppVersionBlockCheck } from "@ledgerhq/live-common/hooks/useAppVersionBlockCheck";

jest.mock("@ledgerhq/live-common/hooks/useAppVersionBlockCheck", () => ({
  useAppVersionBlockCheck: jest.fn(),
}));
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/config/urls", () => ({
  urls: { geoBlock: { learnMore: "https://test/learn-more" } },
}));

describe("AppVersionBlocker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when not blocked", () => {
    (useAppVersionBlockCheck as jest.Mock).mockReturnValue({ shouldUpdate: false });
    render(
      <AppVersionBlocker>
        <div data-testid="child">Visible</div>
      </AppVersionBlocker>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders version blocking UI when blocked", () => {
    (useAppVersionBlockCheck as jest.Mock).mockReturnValue({ shouldUpdate: true });
    render(
      <AppVersionBlocker>
        <div data-testid="child">Should not be visible</div>
      </AppVersionBlocker>,
    );
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    expect(screen.getByText(/Location unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ledger wallet is not available in this location./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Learn more/i)).toBeInTheDocument();
  });

  it("calls openURL with correct URL when Learn More link is clicked", () => {
    (useAppVersionBlockCheck as jest.Mock).mockReturnValue({ shouldUpdate: true });
    render(
      <AppVersionBlocker>
        <div>child</div>
      </AppVersionBlocker>,
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
    (useAppVersionBlockCheck as jest.Mock).mockImplementation(({ onFinish: cb }) => {
      onFinish = cb;
      return { shouldUpdate: false };
    });
    render(
      <AppVersionBlocker>
        <div>child</div>
      </AppVersionBlocker>,
    );
    onFinish();
    expect(appLoaded).toHaveBeenCalled();
  });

  it("renders nothing if children is null and not blocked", () => {
    (useAppVersionBlockCheck as jest.Mock).mockReturnValue({ shouldUpdate: false });
    const { container } = render(<AppVersionBlocker>{null}</AppVersionBlocker>);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders custom children when not blocked", () => {
    (useAppVersionBlockCheck as jest.Mock).mockReturnValue({ shouldUpdate: false });
    render(
      <AppVersionBlocker>
        <span>Custom Content</span>
      </AppVersionBlocker>,
    );
    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });
});
