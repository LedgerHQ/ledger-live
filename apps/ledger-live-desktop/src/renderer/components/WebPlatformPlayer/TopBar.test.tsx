import React from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useSelector } from "LLD/hooks/redux";
import { render, screen, fireEvent } from "tests/testSetup";
import { MemoryRouter } from "react-router";
import { TopBar } from "./TopBar";
import { WebviewState } from "../Web3AppWebview/types";

jest.mock("LLD/hooks/redux", () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

const mockManifest: LiveAppManifest | undefined = {
  id: "earn",
  name: "Earn",
  private: false,
  url: "http://localhost:3000",
  homepageUrl: "http://localhost:3000",
  icon: "",
  platforms: ["android", "ios", "desktop"],
  providerTestBaseUrl: "",
  providerTestId: "",
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "experimental",
  categories: ["earn"],
  currencies: "*",
  content: {
    shortDescription: {
      en: "Earn dashboard",
    },
    description: {
      en: "Earn dashboard",
    },
  },
  permissions: ["account.list", "account.request", "currency.list", "wallet.userId", "wallet.info"],
  domains: ["http://", "https://", "http://localhost:3000"],
  visibility: "complete",
};

const mockWebviewAPIRef = {
  current: {
    reload: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    openDevTools: jest.fn(),
    loadURL: jest.fn(),
    clearHistory: jest.fn(),
    notify: jest.fn(),
  },
};

const mockWebviewState: WebviewState = {
  url: "http://localhost:3000",
  canGoBack: false,
  canGoForward: false,
  title: "Earn",
  loading: false,
  isAppUnavailable: false,
};

describe("Top Bar", () => {
  const mobileView = { display: false, width: 355 };
  const setMobileView = jest.fn();
  const defaultProps = {
    manifest: mockManifest,
    webviewAPIRef: mockWebviewAPIRef,
    webviewState: mockWebviewState,
    mobileView,
    setMobileView,
  };

  it("does not render if isInternalApp is true and dev tools are disabled", () => {
    (useSelector as unknown as jest.Mock).mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("common.sync.refresh")).toBeNull();
    expect(screen.queryByText("common.sync.devTools")).toBeNull();
  });

  it("renders refresh and dev tools buttons when dev tools are enabled", () => {
    (useSelector as unknown as jest.Mock).mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Refresh")).toBeInTheDocument();
    expect(screen.getByText("Dev tools")).toBeInTheDocument();
  });

  it("renders only refresh button when on an external app and dev tools disabled", () => {
    (useSelector as unknown as jest.Mock).mockReturnValue(false);
    const internalManifest = { ...mockManifest, id: "" };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} manifest={internalManifest} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Refresh")).toBeInTheDocument();
    expect(screen.queryByText("common.sync.devTools")).toBeNull();
  });

  it("toggles mobile view when mobile view switch is clicked", () => {
    (useSelector as unknown as jest.Mock).mockReturnValue(true);
    const mockSetMobileView = jest.fn();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} setMobileView={mockSetMobileView} />
      </MemoryRouter>,
    );

    const mobileViewToggle = screen.getByTestId("mobile-view-toggle");

    fireEvent.click(mobileViewToggle);

    expect(mockSetMobileView).toHaveBeenCalledWith(expect.any(Function));
  });

  it("updates mobile width when input value changes", () => {
    (useSelector as unknown as jest.Mock).mockReturnValue(true);
    const mockSetMobileView = jest.fn();
    const mobileViewDisplayed = { display: true, width: 355 };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar
          {...defaultProps}
          mobileView={mobileViewDisplayed}
          setMobileView={mockSetMobileView}
        />
      </MemoryRouter>,
    );
    const widthInput = screen.getByTestId("mobile-view-width-input");
    fireEvent.change(widthInput, { target: { value: "400" } });

    expect(mockSetMobileView).toHaveBeenCalled();
  });
});
