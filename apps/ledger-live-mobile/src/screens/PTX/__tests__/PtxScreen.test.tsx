import React from "react";
import { render } from "@tests/test-renderer";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { ScreenName } from "~/const";
import { PtxScreen } from "../index";

type WebPTXPlayerProps = React.ComponentProps<
  typeof import("~/components/WebPTXPlayer").WebPTXPlayer
>;

const capturedProps: { current: WebPTXPlayerProps | undefined } = { current: undefined };
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock("~/components/WebPTXPlayer", () => ({
  WebPTXPlayer: (props: WebPTXPlayerProps) => {
    capturedProps.current = props;
    return null;
  },
}));

jest.mock("@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index", () => ({
  useRemoteLiveAppManifest: jest.fn(),
  useRemoteLiveAppContext: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppManifest: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, canGoBack: mockCanGoBack }),
}));

jest.mock("LLM/storage", () => ({ delete: jest.fn() }));

jest.mock("@ledgerhq/live-common/hooks/useInternalAppIds", () => ({
  useInternalAppIds: jest.fn(() => []),
}));

jest.mock("@ledgerhq/live-common/hooks/useShowProviderLoadingTransition", () => ({
  useProviderInterstitalEnabled: jest.fn(() => false),
}));

const STUB_MANIFEST: LiveAppManifest = {
  id: "buy-test",
  name: "Buy Test",
  url: "https://buy.test",
  homepageUrl: "https://buy.test",
  platforms: ["ios", "android"],
  apiVersion: "2.0.0",
  manifestVersion: "2",
  branch: "stable",
  permissions: [],
  domains: [],
  categories: [],
  currencies: "*",
  visibility: "complete",
  content: {
    shortDescription: { en: "test" },
    description: { en: "test" },
  },
};

const makeProps = (params: Record<string, unknown> = {}) =>
  ({
    navigation: {} as never,
    route: {
      key: "buy",
      name: ScreenName.ExchangeBuy,
      params: { platform: "buy-test", ...params },
    },
  }) as unknown as React.ComponentProps<typeof PtxScreen>;

describe("PtxScreen — onAccountRequestCancel wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps.current = undefined;
    jest.mocked(useLocalLiveAppManifest).mockReturnValue(undefined);
    jest.mocked(useRemoteLiveAppManifest).mockReturnValue(STUB_MANIFEST);
    jest.mocked(useRemoteLiveAppContext).mockReturnValue({
      state: { isLoading: false },
    } as ReturnType<typeof useRemoteLiveAppContext>);
  });

  it("does not pass cancel callbacks when goBackOnAccountRequestCancel is not set", () => {
    render(<PtxScreen {...makeProps()} />);

    expect(capturedProps.current?.onAccountRequestCancel).toBeUndefined();
    expect(capturedProps.current?.onAccountRequestSuccess).toBeUndefined();
  });

  it("passes cancel callbacks when goBackOnAccountRequestCancel is true", () => {
    render(<PtxScreen {...makeProps({ goBackOnAccountRequestCancel: true })} />);

    expect(capturedProps.current?.onAccountRequestCancel).toBeInstanceOf(Function);
    expect(capturedProps.current?.onAccountRequestSuccess).toBeInstanceOf(Function);
  });

  it("calls navigation.goBack on cancel when goBackOnAccountRequestCancel is true", () => {
    render(<PtxScreen {...makeProps({ goBackOnAccountRequestCancel: true })} />);

    capturedProps.current?.onAccountRequestCancel?.();

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("does not call navigation.goBack on cancel after onAccountRequestSuccess fires", () => {
    render(<PtxScreen {...makeProps({ goBackOnAccountRequestCancel: true })} />);

    capturedProps.current?.onAccountRequestSuccess?.();
    capturedProps.current?.onAccountRequestCancel?.();

    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
