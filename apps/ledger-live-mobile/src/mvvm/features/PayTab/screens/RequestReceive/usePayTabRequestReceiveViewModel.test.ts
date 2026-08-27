import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import Clipboard from "@react-native-clipboard/clipboard";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
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
  useRoute: () => ({ params: { accountId: account.id } }),
}));

function withAccount(state: State): State {
  return { ...state, accounts: { ...state.accounts, active: [account] } };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("usePayTabRequestReceiveViewModel", () => {
  it("should copy the address to the clipboard", () => {
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel(), {
      overrideInitialState: withAccount,
    });

    act(() => result.current.onCopy(account.freshAddress));

    expect(Clipboard.setString).toHaveBeenCalledWith(account.freshAddress);
  });

  it("should share a picture of the request card", async () => {
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel(), {
      overrideInitialState: withAccount,
    });

    await act(async () => result.current.onShare?.(account.freshAddress));

    expect(captureRef).toHaveBeenCalledWith(result.current.cardRef, { format: "png" });
    expect(Share.open).toHaveBeenCalledWith({
      url: "file://mock.png",
      message: account.freshAddress,
      failOnCancel: false,
    });
  });

  it("should hide the tab bar while mounted and restore it on unmount", () => {
    const { store, unmount } = renderHook(() => usePayTabRequestReceiveViewModel(), {
      overrideInitialState: withAccount,
    });

    expect(store.getState().appstate.isMainNavigatorVisible).toBe(false);

    unmount();

    expect(store.getState().appstate.isMainNavigatorVisible).toBe(true);
  });

  it("should go back when closed", () => {
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel(), {
      overrideInitialState: withAccount,
    });

    act(() => result.current.onClose());

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
