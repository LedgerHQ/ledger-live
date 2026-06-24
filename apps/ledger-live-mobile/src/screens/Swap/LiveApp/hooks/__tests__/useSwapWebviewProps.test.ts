import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { Platform } from "react-native";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { useSwapWebviewProps } from "../useSwapWebviewProps";
import { useSwapCustomHandlers } from "../../customHandlers";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
    getParent: jest.fn(),
  })),
}));

jest.mock("../../customHandlers", () => ({
  useSwapCustomHandlers: jest.fn(() => ({ "custom.getFee": jest.fn() })),
}));

jest.mock("~/components/WebPlatformPlayer/CustomHandlers", () => ({
  useDeeplinkCustomHandlers: jest.fn(() => ({ "custom.deeplink": jest.fn() })),
}));

jest.mock("~/analytics/screenRefs", () => ({
  currentRouteNameRef: { current: "SwapTab" },
}));

const STUB_MANIFEST = {
  id: "swap-test",
  url: "https://swap.test",
} as unknown as LiveAppManifest;

const mockedUseSwapCustomHandlers = jest.mocked(useSwapCustomHandlers);
const mockedUseDeeplinkCustomHandlers = jest.mocked(useDeeplinkCustomHandlers);

describe("useSwapWebviewProps", () => {
  const mockResetWebview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (currentRouteNameRef as { current: string | null }).current = "SwapTab";
    mockedUseSwapCustomHandlers.mockReturnValue({ "custom.getFee": jest.fn() } as never);
    mockedUseDeeplinkCustomHandlers.mockReturnValue({ "custom.deeplink": jest.fn() } as never);
  });

  it("should pass resetWebview to useSwapCustomHandlers", () => {
    renderHook(() =>
      useSwapWebviewProps({
        manifest: STUB_MANIFEST,
        params: null,
        resetWebview: mockResetWebview,
      }),
    );

    expect(mockedUseSwapCustomHandlers).toHaveBeenCalledWith(
      STUB_MANIFEST,
      expect.any(Array),
      expect.any(Function),
      mockResetWebview,
    );
  });

  it("should merge swap and deeplink handlers in customHandlers", () => {
    const swapHandler = jest.fn();
    const deeplinkHandler = jest.fn();
    mockedUseSwapCustomHandlers.mockReturnValue({ "custom.getFee": swapHandler } as never);
    mockedUseDeeplinkCustomHandlers.mockReturnValue({
      "custom.deeplink": deeplinkHandler,
    } as never);

    const { result } = renderHook(() =>
      useSwapWebviewProps({
        manifest: STUB_MANIFEST,
        params: null,
        resetWebview: mockResetWebview,
      }),
    );

    expect(
      result.current.customHandlers["custom.getFee" as keyof typeof result.current.customHandlers],
    ).toBe(swapHandler);
    expect(
      result.current.customHandlers[
        "custom.deeplink" as keyof typeof result.current.customHandlers
      ],
    ).toBe(deeplinkHandler);
  });

  it("should return inputs with required platform fields", () => {
    const { result } = renderHook(() =>
      useSwapWebviewProps({
        manifest: STUB_MANIFEST,
        params: null,
        resetWebview: mockResetWebview,
      }),
    );

    const { inputs } = result.current;
    expect(inputs.OS).toBe(Platform.OS);
    expect(inputs.platform).toBe("LLM");
    expect(inputs.lwm40enabled).toBe("true");
  });

  it("should include source from currentRouteNameRef in inputs", () => {
    const { result } = renderHook(() =>
      useSwapWebviewProps({
        manifest: STUB_MANIFEST,
        params: null,
        resetWebview: mockResetWebview,
      }),
    );

    expect(result.current.inputs.source).toBe("SwapTab");
  });

  it("should return both customHandlers and inputs", () => {
    const { result } = renderHook(() =>
      useSwapWebviewProps({
        manifest: STUB_MANIFEST,
        params: null,
        resetWebview: mockResetWebview,
      }),
    );

    expect(result.current).toHaveProperty("customHandlers");
    expect(result.current).toHaveProperty("inputs");
  });

  it("should use empty string as source when currentRouteNameRef is null", () => {
    (currentRouteNameRef as { current: string | null }).current = null;
    const { result } = renderHook(() =>
      useSwapWebviewProps({
        manifest: STUB_MANIFEST,
        params: null,
        resetWebview: mockResetWebview,
      }),
    );
    expect(result.current.inputs.source).toBe("");
  });

  it("should set isModularDrawer to 'true' when llmModularDrawer is enabled with live_app", () => {
    const { result } = renderHook(
      () =>
        useSwapWebviewProps({
          manifest: STUB_MANIFEST,
          params: null,
          resetWebview: mockResetWebview,
        }),
      {
        overrideInitialState: withFlagOverrides({
          llmModularDrawer: { enabled: true, params: { live_app: true } },
        }),
      },
    );

    expect(result.current.inputs.isModularDrawer).toBe("true");
  });
});
