import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerController } from "../useModularDrawerController";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { AccountLike } from "@ledgerhq/types-live";

const mockAccount = genAccount("test_account");
const mockParentAccount = genAccount("parent_account");

jest.mock("../../utils/callbackIdGenerator", () => ({
  generateCallbackId: jest.fn(() => "generated-id"),
}));

describe("useModularDrawerController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with drawer closed", () => {
    const { result } = renderHook(() => useModularDrawerController());
    expect(result.current.isOpen).toBe(false);
  });

  it("should open drawer and set state correctly when called with params", () => {
    const { result, store } = renderHook(() => useModularDrawerController());

    act(() => {
      result.current.openDrawer({
        flow: "receive_flow",
        source: "test_source",
        enableAccountSelection: true,
        currencies: ["bitcoin"],
      });
    });

    const state = store.getState().modularDrawer;
    expect(state.isOpen).toBe(true);
    expect(state.flow).toBe("receive_flow");
    expect(state.source).toBe("test_source");
    expect(state.enableAccountSelection).toBe(true);
    expect(state.preselectedCurrencies).toEqual(["bitcoin"]);
  });

  it("should close the drawer when closeDrawer is called", () => {
    const { result, store } = renderHook(() => useModularDrawerController());

    act(() => {
      result.current.openDrawer({ flow: "test_flow", source: "test_source" });
    });

    act(() => {
      result.current.closeDrawer();
    });

    expect(store.getState().modularDrawer.isOpen).toBe(false);
  });

  describe("handleAccountSelected", () => {
    it("should invoke registered onAccountSelected callback and close the drawer", () => {
      const onAccountSelected = jest.fn();
      const { result, store } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          flow: "receive_flow",
          source: "test_source",
          onAccountSelected,
        });
      });

      expect(store.getState().modularDrawer.callbackId).toBe("generated-id");

      act(() => {
        result.current.handleAccountSelected(mockAccount);
      });

      expect(onAccountSelected).toHaveBeenCalledWith(mockAccount, undefined);
      expect(store.getState().modularDrawer.isOpen).toBe(false);
    });

    it("should pass through parentAccount when it has derivationMode", () => {
      const onAccountSelected = jest.fn();
      const { result } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          flow: "receive_flow",
          source: "test_source",
          onAccountSelected,
        });
      });

      act(() => {
        result.current.handleAccountSelected(mockAccount, mockParentAccount);
      });

      expect(onAccountSelected).toHaveBeenCalledWith(mockAccount, mockParentAccount);
    });

    it("should narrow parentAccount to undefined when it lacks derivationMode", () => {
      const onAccountSelected = jest.fn();
      const tokenLikeParent = { id: "token-parent", type: "TokenAccount" } as AccountLike;
      const { result } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          flow: "receive_flow",
          source: "test_source",
          onAccountSelected,
        });
      });

      act(() => {
        result.current.handleAccountSelected(mockAccount, tokenLikeParent);
      });

      expect(onAccountSelected).toHaveBeenCalledWith(mockAccount, undefined);
    });
  });
});
