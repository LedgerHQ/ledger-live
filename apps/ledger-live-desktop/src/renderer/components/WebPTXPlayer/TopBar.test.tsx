import React from "react";
import { render, screen } from "@testing-library/react";
import { useSelector } from "react-redux";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { TopBar } from "./TopBar";
import { WebviewState } from "../Web3AppWebview/types";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { MemoryRouter } from "react-router";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/hooks/useInternalAppIds", () => ({
  useInternalAppIds: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

const mockManifest: LiveAppManifest | undefined = {
  id: "buy-sell-ui",
  name: "Buy / Sell",
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
  categories: ["exchange", "buy"],
  currencies: "*",
  content: {
    shortDescription: {
      en: "Purchase Bitcoin, Ethereum and more crypto with a selection of providers.",
    },
    description: {
      en: "Purchase Bitcoin, Ethereum and more crypto with a selection of providers.",
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
  title: "Buy / Sell",
  loading: false,
  isAppUnavailable: false,
};

describe("TopBar", () => {
  const defaultProps = {
    manifest: mockManifest,
    webviewAPIRef: mockWebviewAPIRef,
    webviewState: mockWebviewState,
  };

  it("does not render if isInternalApp is true and dev tools are disabled", () => {
    (useSelector as jest.Mock).mockReturnValue(false);
    (useInternalAppIds as jest.Mock).mockReturnValue(INTERNAL_APP_IDS);

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
    (useInternalAppIds as jest.Mock).mockReturnValue([]);

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
    (useInternalAppIds as jest.Mock).mockReturnValue([]);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopBar {...defaultProps} />
      </MemoryRouter>,
    );
    expect(screen.getByText("common.backToMatchingURL")).toBeInTheDocument();
    expect(screen.getByText("common.sync.refresh")).toBeInTheDocument();
    expect(screen.queryByText("common.sync.devTools")).toBeNull();
  });
});
