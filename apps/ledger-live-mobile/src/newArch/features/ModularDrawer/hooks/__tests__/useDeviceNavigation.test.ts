import { renderHook, act } from "@tests/test-renderer";
import { useDeviceNavigation } from "../useDeviceNavigation";
import {
  arbitrumToken,
  mockBtcCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { StepFlowManagerReturnType } from "../useModularDrawerFlowStepManager";
import { NavigationProp } from "@react-navigation/native";
import { ModularDrawerStep } from "../../types";

const mockNavigate = jest.fn();
const mockNavigation: Partial<NavigationProp<Record<string, never>>> = {
  navigate: mockNavigate,
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useDeviceNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const navigationStepManager: StepFlowManagerReturnType = {
    reset: jest.fn(),
    goToStep: jest.fn(),
    currentStep: ModularDrawerStep.Asset,
    currentStepIndex: 0,
  };

  it("navigates to device with a crypto currency", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const { result } = renderHook(() =>
      useDeviceNavigation({ navigationStepManager, onClose, resetSelection }),
    );

    const crypto = mockBtcCryptoCurrency;
    act(() => result.current.navigateToDeviceWithCurrency(crypto));

    expect(onClose).toHaveBeenCalled();
    expect(resetSelection).toHaveBeenCalled();
    expect(navigationStepManager.reset).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("navigates to device with a token currency (uses parent)", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const { result } = renderHook(() =>
      useDeviceNavigation({ navigationStepManager, onClose, resetSelection }),
    );

    const token = arbitrumToken;
    act(() => result.current.navigateToDeviceWithCurrency(token));

    expect(mockNavigate).toHaveBeenCalled();
  });
});
