import { renderHook, act } from "@tests/test-renderer";
import { useDeviceNavigation } from "../useDeviceNavigation";
import {
  arbitrumToken,
  mockBtcCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { NavigationProp } from "@react-navigation/native";
import { ModularDrawerStep } from "../../types";
import { State } from "~/reducers/types";

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

  it("navigates to device with a crypto currency", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result, store } = renderHook(() =>
      useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
    );

    const crypto = mockBtcCryptoCurrency;
    act(() => result.current.navigateToDeviceWithCurrency(crypto));

    expect(onClose).toHaveBeenCalled();
    expect(resetSelection).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
    expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Asset);
  });

  it("navigates to device with a token currency (uses parent)", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result } = renderHook(() =>
      useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
    );

    const token = arbitrumToken;
    act(() => result.current.navigateToDeviceWithCurrency(token));

    expect(mockNavigate).toHaveBeenCalled();
  });

  it("navigates to device with inline flow", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result } = renderHook(
      () => useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: { ...state.modularDrawer, flow: "receive" },
        }),
      },
    );

    act(() => result.current.navigateToDeviceWithCurrency(mockBtcCryptoCurrency));

    expect(mockNavigate).toHaveBeenCalled();
    const callArgs = mockNavigate.mock.calls[0];
    expect(callArgs[1].params.inline).toBe(true);
  });

  it("navigates to device with non-inline flow", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const onAccountSelected = jest.fn();
    const { result } = renderHook(
      () => useDeviceNavigation({ onClose, resetSelection, onAccountSelected }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: { ...state.modularDrawer, flow: "add_account" },
        }),
      },
    );

    act(() => result.current.navigateToDeviceWithCurrency(mockBtcCryptoCurrency));

    expect(mockNavigate).toHaveBeenCalled();
    const callArgs = mockNavigate.mock.calls[0];
    expect(callArgs[1].params.inline).toBe(false);
  });
});
