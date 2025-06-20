import React from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useSelector } from "react-redux";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { TopBar } from "./TopBar";
import { WebviewState } from "../Web3AppWebview/types";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  connect: () => (Component: React.ComponentType<unknown>) => Component,
  useDispatch: () => jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
  withTranslation: () => (Component: React.ComponentType<unknown>) => Component,
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
  const defaultProps = {
    manifest: mockManifest,
    webviewAPIRef: mockWebviewAPIRef,
    webviewState: mockWebviewState,
  };

  it("does not render if isInternalApp is true and dev tools are disabled", () => {
    (useSelector as jest.Mock).mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("common.sync.refresh")).toBeNull();
    expect(screen.queryByText("common.sync.devTools")).toBeNull();
  });

  it("renders refresh and dev tools buttons when dev tools are enabled", () => {
    (useSelector as jest.Mock).mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} />
      </MemoryRouter>,
    );
    expect(screen.getByText("common.sync.refresh")).toBeInTheDocument();
    expect(screen.getByText("common.sync.devTools")).toBeInTheDocument();
  });

  it("renders only refresh button when on an external app and dev tools disabled", () => {
    (useSelector as jest.Mock).mockReturnValue(false);
    const internalManifest = { ...mockManifest, id: "" };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} manifest={internalManifest} />
      </MemoryRouter>,
    );
    expect(screen.getByText("common.sync.refresh")).toBeInTheDocument();
    expect(screen.queryByText("common.sync.devTools")).toBeNull();
  });
});
