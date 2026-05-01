import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppManifest,
  useRemoteLiveAppContext,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { __resetForTests } from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
import { setLiveAppModal, type LiveAppModalParams } from "~/renderer/reducers/liveAppModal";
import LiveAppModal from "..";

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index"),
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("LLD/hooks/useVersionedStakePrograms", () => ({
  useVersionedStakePrograms: jest.fn(() => null),
}));

jest.mock("~/helpers/systemLocale", () => ({
  ...jest.requireActual("~/helpers/systemLocale"),
  getParsedSystemDeviceLocale: jest.fn(() => ({ language: "en", region: "US" })),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockWebviewProps = jest.fn();
jest.mock("~/renderer/components/Web3AppWebview", () => ({
  Web3AppWebview: (props: Record<string, unknown>) => {
    mockWebviewProps(props);
    return <div data-testid="web3-app-webview" />;
  },
}));

jest.mock("~/renderer/components/Web3AppWebview/NetworkError", () => ({
  NetworkErrorScreen: ({ refresh }: { refresh: () => void }) => (
    <button data-testid="network-error" onClick={refresh}>
      retry
    </button>
  ),
}));

const mockedUseLocalLiveAppManifest = jest.mocked(useLocalLiveAppManifest);
const mockedUseRemoteLiveAppManifest = jest.mocked(useRemoteLiveAppManifest);
const mockedUseRemoteLiveAppContext = jest.mocked(useRemoteLiveAppContext);

const mockManifest: LiveAppManifest = {
  id: "test-app",
  author: "Ledger",
  name: "Test Live App",
  url: "https://example.com/app",
  icon: "https://example.com/icon.png",
  homepageUrl: "https://example.com",
  branch: "stable",
  apiVersion: "0.0.1",
  manifestVersion: "1",
  permissions: [],
  domains: ["https://example.com"],
  visibility: "complete",
  categories: [],
  currencies: "*",
  platforms: ["desktop"],
  content: {
    shortDescription: { en: "" },
    description: { en: "" },
  },
};

const baseParams: LiveAppModalParams = {
  requestId: "req-1",
  manifestId: "test-app",
  path: "/some/path",
  title: "Live app title",
  description: "Live app description",
};

describe("LiveAppModal Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetForTests();
    mockedUseLocalLiveAppManifest.mockReturnValue(undefined);
    mockedUseRemoteLiveAppManifest.mockReturnValue(mockManifest);
    mockedUseRemoteLiveAppContext.mockReturnValue({
      state: { isLoading: false, value: null, error: null },
      provider: "production",
      setProvider: jest.fn(),
      updateManifests: jest.fn(),
    });
  });

  describe("rendering", () => {
    it("should not render a dialog when store is empty", () => {
      render(<LiveAppModal />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render title and description when opened", async () => {
      const { store } = render(<LiveAppModal />);

      act(() => {
        store.dispatch(setLiveAppModal(baseParams));
      });

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "Live app title" })).toBeVisible();
      });
      expect(screen.getAllByText("Live app description").length).toBeGreaterThan(0);
      expect(screen.getByTestId("web3-app-webview")).toBeVisible();
    });

    it("should render NetworkErrorScreen when no manifest is available", async () => {
      mockedUseRemoteLiveAppManifest.mockReturnValue(undefined);
      const { store } = render(<LiveAppModal />);

      act(() => {
        store.dispatch(setLiveAppModal(baseParams));
      });

      await waitFor(() => {
        expect(screen.getByTestId("network-error")).toBeVisible();
      });
      expect(screen.queryByTestId("web3-app-webview")).not.toBeInTheDocument();
    });
  });

  describe("webview inputs", () => {
    it("should pass core inputs to the webview", async () => {
      const { store } = render(<LiveAppModal />);

      act(() => {
        store.dispatch(setLiveAppModal(baseParams));
      });

      await waitFor(() => {
        expect(mockWebviewProps).toHaveBeenCalled();
      });
      const lastCall = mockWebviewProps.mock.calls.at(-1)?.[0];
      expect(lastCall.inputs).toEqual(
        expect.objectContaining({
          OS: "web",
          isLiveAppModal: "true",
          liveAppModalRequestId: "req-1",
          countryLocale: "US",
        }),
      );
      expect(typeof lastCall.inputs.lang).toBe("string");
      expect(typeof lastCall.inputs.locale).toBe("string");
      expect(typeof lastCall.inputs.goToURL).toBe("string");
    });

    it("should merge earn extra inputs when useCase is 'earn'", async () => {
      const { store } = render(<LiveAppModal />);

      act(() => {
        store.dispatch(setLiveAppModal({ ...baseParams, useCase: "earn" }));
      });

      await waitFor(() => {
        expect(mockWebviewProps).toHaveBeenCalled();
      });
      const lastCall = mockWebviewProps.mock.calls.at(-1)?.[0];
      expect(lastCall.inputs).toEqual(
        expect.objectContaining({
          uiVersion: "v1",
          lw40enabled: "false",
          ethDepositCohort: expect.any(String),
        }),
      );
    });
  });

  describe("closing", () => {
    it("should close when setLiveAppModal(null) is dispatched", async () => {
      const { store } = render(<LiveAppModal />);

      act(() => {
        store.dispatch(setLiveAppModal(baseParams));
      });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });

      act(() => {
        store.dispatch(setLiveAppModal(null));
      });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should clear Redux state when the close button is clicked", async () => {
      const { store, user } = render(<LiveAppModal />);

      act(() => {
        store.dispatch(setLiveAppModal(baseParams));
      });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeVisible();
      });

      await user.click(screen.getByRole("button", { name: /close/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
      expect(store.getState().liveAppModal).toBeNull();
    });
  });
});
