import { Share } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { act, renderHook } from "@tests/test-renderer";
import { usePayTabRequestReceiveViewModel } from "./usePayTabRequestReceiveViewModel";

jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));

const mockGoBack = jest.fn();
const account = genAccount("pay-tab-request", { currency: getCryptoCurrencyById("ethereum") });

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useRoute: () => ({ params: { account } }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("usePayTabRequestReceiveViewModel", () => {
  it("should copy the address to the clipboard", () => {
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel());

    act(() => result.current.onCopy(account.freshAddress));

    expect(Clipboard.setString).toHaveBeenCalledWith(account.freshAddress);
  });

  it("should share the address", () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel());

    act(() => result.current.onShare?.(account.freshAddress));

    expect(share).toHaveBeenCalledWith({ message: account.freshAddress });
    share.mockRestore();
  });

  it("should hide the tab bar while mounted and restore it on unmount", () => {
    const { store, unmount } = renderHook(() => usePayTabRequestReceiveViewModel());

    expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);

    unmount();

    expect(store.getState().appstate.isMainNavigatorVisible).toBe(true);
  });

  it("should go back when closed", () => {
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel());

    act(() => result.current.onClose());

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
