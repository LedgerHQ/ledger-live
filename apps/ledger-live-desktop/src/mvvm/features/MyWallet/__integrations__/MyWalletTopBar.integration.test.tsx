import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { useNavigate } from "react-router";
import { resetTrackingPages, setTrackingSource, track } from "@shared/analytics";
import { ContextMenu } from "../components/ContextMenu";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../constants";

const mockNavigate = jest.fn();
const SEEDED_TRACKING_PAGE = "Portfolio";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
  useLocation: jest.fn(() => ({
    pathname: "/",
    state: null,
    key: "default",
    search: "",
    hash: "",
  })),
}));

jest.mock("@shared/analytics", () => {
  const actual = jest.requireActual<typeof import("@shared/analytics")>("@shared/analytics");
  return {
    ...actual,
    track: jest.fn(),
    trackPage: jest.fn(),
    setTrackingSource: jest.fn((source?: string) => actual.setTrackingSource(source)),
  };
});

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
  resetStore: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockSetTrackingSource = jest.mocked(setTrackingSource);
const mockTrack = jest.mocked(track);

describe("MyWallet ContextMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    setTrackingSource(SEEDED_TRACKING_PAGE);
  });

  afterEach(() => {
    resetTrackingPages();
  });

  it("should render My Wallet trigger button", () => {
    render(<ContextMenu />);

    expect(screen.getByRole("button", { name: "My Wallet" })).toBeVisible();
    expect(screen.getByTestId("my-wallet-avatar")).toBeVisible();
  });

  it("should show settings and notifications buttons inside the popover when opened", async () => {
    const { user } = render(<ContextMenu />);

    await user.click(screen.getByRole("button", { name: "My Wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("topbar-action-button-settings")).toBeVisible();
      expect(screen.getByTestId("topbar-action-button-notifications")).toBeVisible();
    });

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.menu,
      page: SEEDED_TRACKING_PAGE,
    });
  });

  it("should navigate to /settings with 'My Wallet' tracking source when clicking settings", async () => {
    const { user } = render(<ContextMenu />);

    await user.click(screen.getByRole("button", { name: "My Wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("topbar-action-button-settings")).toBeVisible();
    });

    await user.click(screen.getByTestId("topbar-action-button-settings"));

    expect(mockSetTrackingSource).toHaveBeenCalledWith("My Wallet");
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.settings,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });
});
