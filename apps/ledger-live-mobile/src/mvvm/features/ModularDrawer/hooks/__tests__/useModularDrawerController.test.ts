import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawerController } from "../useModularDrawerController";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { AccountLike } from "@ledgerhq/types-live";
import { mockEthCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { setStep } from "~/reducers/modularDrawer";
import { ModularDrawerStep } from "../../types";

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
    expect(state.presentation).toBe("drawer");
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

  describe("currency completion", () => {
    it("should store embedded presentation for a currency selection", () => {
      const { result, store } = renderHook(() => useModularDrawerController());

      act(() => store.dispatch(setStep(ModularDrawerStep.Account)));
      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          presentation: "embedded",
          enableAccountSelection: true,
          onCurrencySelected: jest.fn(),
        });
      });

      expect(store.getState().modularDrawer.presentation).toBe("embedded");
      expect(store.getState().modularDrawer.enableAccountSelection).toBe(false);
      expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Asset);
      expect(result.current.presentation).toBe("embedded");
    });

    it("should restore drawer presentation when embedded selection is replaced", () => {
      const { result, store } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          presentation: "embedded",
          onCurrencySelected: jest.fn(),
        });
      });
      act(() => result.current.openDrawer({ flow: "add_account" }));

      expect(store.getState().modularDrawer.presentation).toBe("drawer");
    });

    it("should restore drawer presentation when embedded selection is closed", () => {
      const onCurrencySelected = jest.fn();
      const { result, store } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          presentation: "embedded",
          currencies: ["ethereum"],
          onCurrencySelected,
        });
      });
      act(() => result.current.closeDrawer());

      expect(onCurrencySelected).toHaveBeenCalledWith(null);
      expect(onCurrencySelected).toHaveBeenCalledTimes(1);
      expect(store.getState().modularDrawer).toMatchObject({
        isOpen: false,
        preselectedCurrencies: [],
        callbackId: undefined,
        completionMode: undefined,
        presentation: "drawer",
        step: "Asset",
      });
    });

    it("should return the selected currency and reset an embedded drawer", () => {
      const onCurrencySelected = jest.fn();
      const { result, store } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          presentation: "embedded",
          currencies: ["ethereum"],
          onCurrencySelected,
        });
      });
      act(() => result.current.handleCurrencySelected(mockEthCryptoCurrency));

      expect(onCurrencySelected).toHaveBeenCalledWith(mockEthCryptoCurrency);
      expect(onCurrencySelected).toHaveBeenCalledTimes(1);
      expect(store.getState().modularDrawer).toMatchObject({
        isOpen: false,
        preselectedCurrencies: [],
        callbackId: undefined,
        completionMode: undefined,
        presentation: "drawer",
        step: "Asset",
      });
    });

    it("should return null once when currency selection is cancelled", () => {
      const onCurrencySelected = jest.fn();
      const { result } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          onCurrencySelected,
        });
      });
      act(() => result.current.closeDrawer());
      act(() => result.current.closeDrawer());

      expect(onCurrencySelected).toHaveBeenCalledWith(null);
      expect(onCurrencySelected).toHaveBeenCalledTimes(1);
    });

    it("should cancel an active currency selection when replaced", () => {
      const firstSelection = jest.fn();
      const nextSelection = jest.fn();
      const { result } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          onCurrencySelected: firstSelection,
        });
      });
      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          onCurrencySelected: nextSelection,
        });
      });

      expect(firstSelection).toHaveBeenCalledWith(null);
      expect(firstSelection).toHaveBeenCalledTimes(1);
      expect(nextSelection).not.toHaveBeenCalled();
    });

    it("should clear a stale callback id when the next drawer has no callback", () => {
      const { result, store } = renderHook(() => useModularDrawerController());

      act(() => {
        result.current.openDrawer({
          completionMode: "currency",
          onCurrencySelected: jest.fn(),
        });
      });
      expect(store.getState().modularDrawer.callbackId).toBe("generated-id");

      act(() => result.current.openDrawer({ flow: "add_account" }));

      expect(store.getState().modularDrawer.callbackId).toBeUndefined();
      expect(store.getState().modularDrawer.completionMode).toBeUndefined();
    });
  });
});
