import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { useNavigate } from "react-router";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { ContextMenu } from "../components/ContextMenu";

const mockNavigate = jest.fn();

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

jest.mock("~/renderer/analytics/TrackPage", () => ({
  setTrackingSource: jest.fn(),
}));

const mockedUseNavigate = jest.mocked(useNavigate);
const mockSetTrackingSource = jest.mocked(setTrackingSource);

describe("MyWallet ContextMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("should render My Wallet trigger button", () => {
    render(<ContextMenu />);

    expect(screen.getByRole("button", { name: "My wallet" })).toBeVisible();
    expect(screen.getByTestId("my-wallet-avatar")).toBeVisible();
  });

  it("should show settings and notifications buttons inside the popover when opened", async () => {
    const { user } = render(<ContextMenu />);

    await user.click(screen.getByRole("button", { name: "My wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("topbar-action-button-settings")).toBeVisible();
      expect(screen.getByTestId("topbar-action-button-notifications")).toBeVisible();
    });
  });

  it("should navigate to /settings with 'mywallet' tracking source when clicking settings", async () => {
    const { user } = render(<ContextMenu />);

    await user.click(screen.getByRole("button", { name: "My wallet" }));

    await waitFor(() => {
      expect(screen.getByTestId("topbar-action-button-settings")).toBeVisible();
    });

    await user.click(screen.getByTestId("topbar-action-button-settings"));

    expect(mockSetTrackingSource).toHaveBeenCalledWith("mywallet");
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });
});
