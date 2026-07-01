import { renderHook } from "@testing-library/react-native";
import type { AccountLike } from "@ledgerhq/types-live";
import { useWebviewState, useUiHook } from "./helpers";
import { getInitialURL } from "@ledgerhq/live-common/wallet-api/helpers";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useFeature } from "@features/platform-feature-flags";
import { NavigatorName, ScreenName } from "~/const";
import prepareSignTransaction from "./liveSDKLogic";

const mockNavigate = jest.fn();

jest.mock("@ledgerhq/live-common/wallet-api/helpers", () => ({
  getInitialURL: jest.fn(),
  getClientHeaders: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/live-common/wallet-api/manifestDomainUtils", () => ({
  isUrlAllowedByManifestDomains: jest.fn(() => true),
}));

jest.mock("@ledgerhq/live-common/wallet-api/react", () => ({
  safeGetRefValue: jest.fn(),
}));

jest.mock("styled-components/native", () => ({
  useTheme: jest.fn(() => ({ theme: "dark" })),
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: jest.fn(() => ({ openDrawer: jest.fn() })),
}));

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return { ...actual, useNavigation: () => ({ navigate: mockNavigate }) };
});

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(() => ({ enabled: false })),
}));

jest.mock("@ledgerhq/live-common/dada-client/hooks/useDrawerConfiguration", () => ({
  useDrawerConfiguration: jest.fn(() => ({ createDrawerConfiguration: jest.fn(() => ({})) })),
}));

jest.mock("./liveSDKLogic", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockManifest: LiveAppManifest = {
  id: "test-app",
  name: "Test App",
  private: false,
  url: "https://example.com",
  homepageUrl: "https://example.com",
  icon: "",
  platforms: ["ios", "android"],
  providerTestBaseUrl: "",
  providerTestId: "",
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: [],
  currencies: "*",
  content: {
    shortDescription: { en: "Test" },
    description: { en: "Test" },
  },
  permissions: [],
  domains: ["https://example.com"],
  visibility: "complete",
};

const mockGetInitialURL = jest.mocked(getInitialURL);

describe("useWebviewState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("webviewProps.source.uri", () => {
    it("is set to the URL returned by getInitialURL on mount", () => {
      mockGetInitialURL.mockReturnValue("https://example.com/?theme=dark");

      const { result } = renderHook(() =>
        useWebviewState({ manifest: mockManifest }, null, undefined),
      );

      expect(result.current.webviewProps.source).toMatchObject({
        uri: "https://example.com/?theme=dark",
      });
    });

    it("updates when inputs.goToURL changes (deeplink navigation)", () => {
      // When a live app is already open and the user taps a deeplink that targets
      // a different path in the same app (e.g. Baanx card top-up → card details),
      // the webview must navigate to the new URL
      mockGetInitialURL
        .mockReturnValueOnce("https://example.com/")
        .mockReturnValue("https://example.com/fund?accountId=123");

      const { result, rerender } = renderHook(
        (props: { inputs?: Record<string, string> }) =>
          useWebviewState({ manifest: mockManifest, inputs: props.inputs }, null, undefined),
        { initialProps: { inputs: undefined } },
      );

      expect(result.current.webviewProps.source).toMatchObject({ uri: "https://example.com/" });

      rerender({ inputs: { goToURL: "https://example.com/fund?accountId=123" } });

      expect(result.current.webviewProps.source).toMatchObject({
        uri: "https://example.com/fund?accountId=123",
      });
    });

    it("updates when the manifest changes", () => {
      // When the manifest is swapped (e.g. the platform catalog refreshes live app
      // config from the server and a new manifest object is passed down), the webview
      // must navigate to the URL derived from the new manifest
      const updatedManifest: LiveAppManifest = {
        ...mockManifest,
        url: "https://new.example.com",
        domains: ["https://new.example.com"],
      };

      mockGetInitialURL
        .mockReturnValueOnce("https://example.com")
        .mockReturnValue("https://new.example.com");

      const { result, rerender } = renderHook(
        (props: { manifest: LiveAppManifest }) =>
          useWebviewState({ manifest: props.manifest }, null, undefined),
        { initialProps: { manifest: mockManifest } },
      );

      expect(result.current.webviewProps.source).toMatchObject({ uri: "https://example.com" });

      rerender({ manifest: updatedManifest });

      expect(result.current.webviewProps.source).toMatchObject({
        uri: "https://new.example.com",
      });
    });
  });
});

describe("useUiHook - transaction.sign device-intent branching", () => {
  const mockedUseFeature = jest.mocked(useFeature);
  const mockedPrepare = jest.mocked(prepareSignTransaction);
  const mockRequestDeviceIntentSign = jest.fn();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const account = { id: "js:2:ethereum:0xabc:", type: "Account" } as unknown as AccountLike;
  const preparedTx = { family: "ethereum" };

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockedPrepare.mockResolvedValue(preparedTx as never);
  });

  function invokeSign(signFlowInfos: { canEditFees: boolean; hasFeesProvided: boolean }) {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useUiHook({
        manifest: mockManifest,
        requestDeviceIntentSign: mockRequestDeviceIntentSign,
        requestDeviceIntentSignMessage: jest.fn(),
      }),
    );
    const promise = result.current["transaction.sign"]!({
      account,
      parentAccount: undefined,
      signFlowInfos: { liveTx: {}, ...signFlowInfos },
      options: { hwAppId: undefined, dependencies: undefined },
      onSuccess,
      onError,
    });
    return { promise, onSuccess, onError };
  }

  it("navigates to the legacy summary screen when the flag is disabled", async () => {
    mockedUseFeature.mockReturnValue({ enabled: false } as ReturnType<typeof useFeature>);

    await invokeSign({ canEditFees: false, hasFeesProvided: true }).promise;

    expect(mockNavigate).toHaveBeenCalledWith(
      NavigatorName.SignTransaction,
      expect.objectContaining({ screen: ScreenName.SignTransactionSummary }),
    );
    expect(mockRequestDeviceIntentSign).not.toHaveBeenCalled();
  });

  it("requests the device-intent signature drawer when the flag is enabled and fees are provided", async () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { enabledManifestIds: ["test-app"] },
    } as ReturnType<typeof useFeature>);

    const { promise, onSuccess, onError } = invokeSign({
      canEditFees: false,
      hasFeesProvided: true,
    });
    await promise;

    expect(mockRequestDeviceIntentSign).toHaveBeenCalledWith(
      expect.objectContaining({ account, transaction: preparedTx, onSuccess, onError }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("requests the drawer even when fees are editable and not provided (no legacy fee-editing buffer)", async () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { enabledManifestIds: ["test-app"] },
    } as ReturnType<typeof useFeature>);

    const { promise } = invokeSign({ canEditFees: true, hasFeesProvided: false });
    await promise;

    expect(mockRequestDeviceIntentSign).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to the legacy summary screen when enabled but the manifest id is not allowlisted", async () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { enabledManifestIds: ["another-app"] },
    } as ReturnType<typeof useFeature>);

    await invokeSign({ canEditFees: false, hasFeesProvided: true }).promise;

    expect(mockNavigate).toHaveBeenCalledWith(
      NavigatorName.SignTransaction,
      expect.objectContaining({ screen: ScreenName.SignTransactionSummary }),
    );
    expect(mockRequestDeviceIntentSign).not.toHaveBeenCalled();
  });
});

describe("useUiHook - message.sign device-intent branching", () => {
  const mockedUseFeature = jest.mocked(useFeature);
  const mockRequestDeviceIntentSignMessage = jest.fn();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const account = { id: "js:2:ethereum:0xabc:", type: "Account" } as unknown as AccountLike;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const message = { standard: undefined, message: "hello" } as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function invokeMessageSign() {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const { result } = renderHook(() =>
      useUiHook({
        manifest: mockManifest,
        requestDeviceIntentSign: jest.fn(),
        requestDeviceIntentSignMessage: mockRequestDeviceIntentSignMessage,
      }),
    );
    result.current["message.sign"]!({
      account,
      message,
      options: { hwAppId: undefined, dependencies: undefined },
      onSuccess,
      onError,
      onCancel,
    });
    return { onSuccess, onError, onCancel };
  }

  it("navigates to the SignMessage stack when the flag is disabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: false } as ReturnType<typeof useFeature>);

    invokeMessageSign();

    expect(mockNavigate).toHaveBeenCalledWith(
      NavigatorName.SignMessage,
      expect.objectContaining({ params: expect.objectContaining({ accountId: account.id }) }),
    );
    expect(mockRequestDeviceIntentSignMessage).not.toHaveBeenCalled();
  });

  it("requests the device-intent message drawer when the flag is enabled", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { enabledManifestIds: ["test-app"] },
    } as ReturnType<typeof useFeature>);

    const { onSuccess, onError, onCancel } = invokeMessageSign();

    expect(mockRequestDeviceIntentSignMessage).toHaveBeenCalledWith(
      expect.objectContaining({ account, message, onSuccess, onError, onCancel }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
