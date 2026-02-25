import React from "react";
import { render, screen } from "tests/testSetup";
import { AppVersionBlocker } from "../index";
import { useAppVersionBlockCheck } from "@ledgerhq/live-common/hooks/useAppVersionBlockCheck";

jest.mock("@ledgerhq/live-common/hooks/useAppVersionBlockCheck", () => ({
  useAppVersionBlockCheck: jest.fn(),
}));
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/config/urls", () => ({
  urls: { liveHome: "https://test/live-home" },
}));

jest.mock("../../AppBlocker", () => ({
  AppBlocker: ({ children, blocked }: { children: React.ReactNode; blocked: boolean }) =>
    blocked ? null : children,
}));

jest.mock("~/renderer/components/FirebaseRemoteConfig", () => ({
  useFirebaseRemoteConfig: () => ({
    config: {},
    lastFetchTime: Date.now(),
  }),
}));

jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    getValueByKey: jest.fn(),
  },
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
