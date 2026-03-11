import { renderHook, act } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import useAddAccountViewModel from "../useAddAccountViewModel";
import { Steps } from "LLM/features/WalletSync/types/Activation";

const navigate = jest.fn();
const openDrawer = jest.fn();
const mockSetCurrentStep = jest.fn();
const mockCurrentStep = { current: Steps.AddAccountMethod };

jest.mock("~/analytics", () => ({ track: jest.fn() }));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useNavigationIndependentTree: actual.useNavigationIndependentTree || (() => ({})),
    useNavigation: () => ({ navigate }),
  };
});

jest.mock("LLM/features/WalletSync/hooks/useCurrentStep", () => ({
  useCurrentStep: () => ({
    currentStep: mockCurrentStep.current,
    setCurrentStep: (step: string) => {
      mockCurrentStep.current = step as Steps;
      mockSetCurrentStep(step);
    },
  }),
}));

jest.mock("LLM/features/WalletSync/hooks/useQRCodeHost", () => ({
  useQRCodeHost: () => ({
    url: null,
    error: null,
    isLoading: false,
    pinCode: null,
  }),
}));

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer }),
}));

describe("useAddAccountViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentStep.current = Steps.AddAccountMethod;
  });

  it("should start at AddAccountMethod step when shouldOpenModularDrawerDirectly is false", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountViewModel({ isOpened: true, onClose }),
    );

    expect(result.current.isAddAccountDrawerVisible).toBe(true);
    expect(mockSetCurrentStep).toHaveBeenCalledWith(Steps.AddAccountMethod);
  });

  it("should navigate to ChooseSyncMethod step", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountViewModel({ isOpened: true, onClose }),
    );

    act(() => result.current.navigateToChooseSyncMethod());

    expect(mockSetCurrentStep).toHaveBeenCalledWith(Steps.ChooseSyncMethod);
  });

  it("should navigate to QrCodeMethod step", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountViewModel({ isOpened: true, onClose }),
    );

    act(() => result.current.navigateToQrCodeMethod());

    expect(mockSetCurrentStep).toHaveBeenCalledWith(Steps.QrCodeMethod);
  });

  it("should go back from QrCodeMethod to ChooseSyncMethod", () => {
    mockCurrentStep.current = Steps.QrCodeMethod;
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountViewModel({ isOpened: true, onClose }),
    );

    act(() => result.current.onGoBack());

    expect(mockSetCurrentStep).toHaveBeenCalledWith(Steps.ChooseSyncMethod);
  });

  it("should go back from ChooseSyncMethod to starting step", () => {
    mockCurrentStep.current = Steps.ChooseSyncMethod;
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountViewModel({ isOpened: true, onClose }),
    );

    act(() => result.current.onGoBack());

    expect(mockSetCurrentStep).toHaveBeenCalledWith(Steps.AddAccountMethod);
  });

  it("should call onClose on close drawer", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountViewModel({ isOpened: true, onClose }),
    );

    act(() => result.current.onCloseAddAccountDrawer());

    expect(onClose).toHaveBeenCalled();
  });

  it("should open modular drawer directly when lwmLedgerSyncOptimisation enabled and trustchain exists", () => {
    const onClose = jest.fn();

    renderHook(
      () => useAddAccountViewModel({ isOpened: true, onClose }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              lwmLedgerSyncOptimisation: { enabled: true },
            },
          },
          trustchain: {
            ...state.trustchain,
            trustchain: { rootId: "root-1", applicationPath: "m/0'", walletSyncEncryptionKey: "" },
          },
        }),
      },
    );

    expect(openDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: "add_account",
        source: "add_account_drawer",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
