import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import Clipboard from "@react-native-clipboard/clipboard";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import type { PayTabNavigatorParamList } from "../../types";
import { usePayTabRequestReceiveViewModel } from "./usePayTabRequestReceiveViewModel";

jest.mock("@react-native-clipboard/clipboard", () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));

const mockGoBack = jest.fn();
const ethereum = getCryptoCurrencyById("ethereum");
const account = genAccount("pay-tab-request", { currency: ethereum });
const mockRoute: { params: PayTabNavigatorParamList[typeof ScreenName.PayTabRequestReceive] } = {
  params: { accountId: account.id, currency: ethereum },
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
}));

function withAccount(state: State): State {
  return { ...state, accounts: { ...state.accounts, active: [account] } };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRoute.params = { accountId: account.id, currency: ethereum };
});

describe("usePayTabRequestReceiveViewModel", () => {
  it("should copy the address to the clipboard", () => {
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel(), {
      overrideInitialState: withAccount,
    });

    act(() => result.current.requestReceive.onCopy(account.freshAddress));

    expect(Clipboard.setString).toHaveBeenCalledWith(account.freshAddress);
  });

  it("should share a picture of the request card", async () => {
    const { result } = renderHook(() => usePayTabRequestReceiveViewModel(), {
      overrideInitialState: withAccount,
    });

    await act(async () => result.current.requestReceive.onShare?.(account.freshAddress));

    expect(captureRef).toHaveBeenCalledWith(result.current.requestReceive.cardRef, {
      format: "png",
    });
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

    act(() => result.current.requestReceive.onClose());

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("should keep the parent address when the selected token is not in the store", () => {
    const parentAccount = genAccount("pay-tab-request-parent", { currency: ethereum });
    const usdc = TokenCurrencySchema.parse({
      type: "TokenCurrency",
      id: "ethereum/erc20/usd__coin",
      parentCurrencyId: ethereum.id,
      contractAddress: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
      tokenType: "erc20",
      ticker: "USDC",
      name: "USD Coin",
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    });
    mockRoute.params = {
      accountId: parentAccount.id,
      parentId: parentAccount.id,
      currency: usdc,
    };

    const { result } = renderHook(() => usePayTabRequestReceiveViewModel(), {
      overrideInitialState: (state: State) => ({
        ...state,
        accounts: { ...state.accounts, active: [parentAccount] },
      }),
    });

    expect(mockGoBack).not.toHaveBeenCalled();
    expect(result.current.requestReceive.address).toBe(parentAccount.freshAddress);
    expect(result.current.requestReceive.asset).toEqual({ name: "USD Coin", ticker: "USDC" });
  });

  it("should not go back when the account is not in the store", () => {
    mockRoute.params = { accountId: "missing-account", currency: ethereum };

    const { result } = renderHook(() => usePayTabRequestReceiveViewModel());

    expect(mockGoBack).not.toHaveBeenCalled();
    expect(result.current.requestReceive.address).toBe("");
  });
});
