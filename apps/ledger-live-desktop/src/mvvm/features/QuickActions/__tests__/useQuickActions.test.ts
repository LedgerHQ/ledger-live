import { renderHook, act } from "tests/testSetup";
import { useQuickActions } from "../hooks/useQuickActions";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useNavigate, useLocation } from "react-router";
import { ArrowDown, Plus, Minus, ArrowUp } from "@ledgerhq/lumen-ui-react/symbols";
import { hasAccountsSelector, areAccountsEmptySelector } from "~/renderer/reducers/accounts";

jest.mock("LLD/features/Send/hooks/useOpenSendFlow");
jest.mock("~/renderer/actions/modals", () => ({
  openModal: jest.fn((name, data) => ({ type: "OPEN_MODAL", name, data })),
}));
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));
jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockOpenSendFlow = jest.fn();

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseOpenSendFlow = useOpenSendFlow as jest.MockedFunction<typeof useOpenSendFlow>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe("useQuickActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseOpenSendFlow.mockReturnValue(mockOpenSendFlow);
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({
      pathname: "/accounts",
      state: null,
      key: "default",
      search: "",
      hash: "",
    });
    // Default: has accounts and has funds
    mockUseSelector.mockImplementation(selector => {
      if (selector === hasAccountsSelector) {
        return true;
      }
      if (selector === areAccountsEmptySelector) {
        return false;
      }
      return false;
    });
  });

  describe("actions structure", () => {
    it("should return receive action with correct properties", () => {
      const { result } = renderHook(() => useQuickActions());

      const receiveAction = result.current.actionsList[0];
      expect(receiveAction.title).toBe("Receive");
      expect(receiveAction.icon).toBe(ArrowDown);
      expect(receiveAction.disabled).toBe(false);
      expect(typeof receiveAction.onAction).toBe("function");
    });

    it("should return buy action with correct properties", () => {
      const { result } = renderHook(() => useQuickActions());

      const buyAction = result.current.actionsList[1];
      expect(buyAction.title).toBe("Buy");
      expect(buyAction.icon).toBe(Plus);
      expect(buyAction.disabled).toBe(false);
      expect(typeof buyAction.onAction).toBe("function");
    });

    it("should return sell action with correct properties", () => {
      const { result } = renderHook(() => useQuickActions());

      const sellAction = result.current.actionsList[2];
      expect(sellAction.title).toBe("Sell");
      expect(sellAction.icon).toBe(Minus);
      expect(sellAction.disabled).toBe(false);
      expect(typeof sellAction.onAction).toBe("function");
    });

    it("should return send action with correct properties", () => {
      const { result } = renderHook(() => useQuickActions());

      const sendAction = result.current.actionsList[3];
      expect(sendAction.title).toBe("Send");
      expect(sendAction.icon).toBe(ArrowUp);
      expect(sendAction.disabled).toBe(false);
      expect(typeof sendAction.onAction).toBe("function");
    });
  });

  describe("sell action disabled state", () => {
    it("should enable sell action when accounts have funds", () => {
      mockUseSelector.mockImplementation(selector => {
        if (selector === hasAccountsSelector) {
          return true;
        }
        return false; // areAccountsEmpty = false
      });

      const { result } = renderHook(() => useQuickActions());

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(false);
    });

    it("should disable sell action when accounts are empty", () => {
      mockUseSelector.mockImplementation(selector => {
        if (selector === hasAccountsSelector) {
          return true;
        }
        return true; // areAccountsEmpty = true
      });

      const { result } = renderHook(() => useQuickActions());

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(true);
    });
  });

  describe("onReceive action", () => {
    it("should dispatch openModal with MODAL_RECEIVE when has accounts", () => {
      mockUseSelector.mockImplementation(selector => {
        if (selector === hasAccountsSelector) {
          return true; // hasAccount = true
        }
        if (selector === areAccountsEmptySelector) {
          return false;
        }
        return false;
      });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: "OPEN_MODAL",
        name: "MODAL_RECEIVE",
        data: undefined,
      });
    });

    it("should open MODAL_ADD_ACCOUNTS when no accounts", () => {
      mockUseSelector.mockImplementation(selector => {
        if (selector === hasAccountsSelector) {
          return false; // hasAccount = false
        }
        if (selector === areAccountsEmptySelector) {
          return true;
        }
        return false;
      });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: "OPEN_MODAL",
        name: "MODAL_ADD_ACCOUNTS",
        data: undefined,
      });
    });

    it("should not navigate when already on accounts page", () => {
      mockUseLocation.mockReturnValue({
        pathname: "/accounts",
        state: null,
        key: "default",
        search: "",
        hash: "",
      });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should navigate to accounts when on manager page", () => {
      mockUseSelector.mockImplementation(selector => {
        if (selector === hasAccountsSelector) {
          return true;
        }
        return false; // areAccountsEmpty = true
      });
      mockUseLocation.mockReturnValue({
        pathname: "/manager",
        state: null,
        key: "default",
        search: "",
        hash: "",
      });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: "OPEN_MODAL",
        name: "MODAL_RECEIVE",
        data: undefined,
      });
    });
  });

  describe("onBuy action", () => {
    it("should navigate to exchange with buy mode", () => {
      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[1].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: {
          mode: "buy",
        },
      });
    });
  });

  describe("onSell action", () => {
    it("should navigate to exchange with sell mode", () => {
      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[2].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: {
          mode: "sell",
        },
      });
    });
  });

  describe("onSend action", () => {
    it("should call openSendFlow when called", () => {
      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });

    it("should not navigate when already on accounts page", () => {
      mockUseLocation.mockReturnValue({
        pathname: "/accounts",
        state: null,
        key: "default",
        search: "",
        hash: "",
      });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });

    it("should navigate to accounts when on manager page", () => {
      mockUseLocation.mockReturnValue({
        pathname: "/manager",
        state: null,
        key: "default",
        search: "",
        hash: "",
      });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });
  });

  describe("memoization", () => {
    it("should return stable action callbacks when dependencies don't change", () => {
      const { result, rerender } = renderHook(() => useQuickActions());

      const firstRender = result.current.actionsList;
      rerender();
      const secondRender = result.current.actionsList;

      expect(firstRender[0].onAction).toBe(secondRender[0].onAction);
      expect(firstRender[1].onAction).toBe(secondRender[1].onAction);
      expect(firstRender[2].onAction).toBe(secondRender[2].onAction);
      expect(firstRender[3].onAction).toBe(secondRender[3].onAction);
    });

    it("should update callbacks when location changes", () => {
      const { result, rerender } = renderHook(() => useQuickActions());

      const firstRender = result.current.actionsList;

      mockUseLocation.mockReturnValue({
        pathname: "/manager",
        state: null,
        key: "different",
        search: "",
        hash: "",
      });

      rerender();
      const secondRender = result.current.actionsList;

      expect(firstRender[0].onAction).not.toBe(secondRender[0].onAction);
    });
  });
});
