import { renderHook, act } from "tests/testSetup";
import { useQuickActions } from "../hooks/useQuickActions";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { openModal } from "~/renderer/actions/modals";
import { useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { ArrowDown, Plus, Minus, ArrowUp } from "@ledgerhq/lumen-ui-react/symbols";

jest.mock("LLD/features/Send/hooks/useOpenSendFlow");
jest.mock("~/renderer/actions/modals");
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
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseOpenSendFlow.mockReturnValue(mockOpenSendFlow);
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({ pathname: "/accounts" });
    mockUseSelector.mockImplementation(() => false);
    jest.clearAllMocks();
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
      mockUseSelector.mockImplementation(() => false);

      const { result } = renderHook(() => useQuickActions());

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(false);
    });

    it("should disable sell action when accounts are empty", () => {
      mockUseSelector.mockImplementation(() => true);

      const { result } = renderHook(() => useQuickActions());

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(true);
    });
  });

  describe("onReceive action", () => {
    it("should dispatch openModal with MODAL_RECEIVE when called", () => {
      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockDispatch).toHaveBeenCalledWith(openModal("MODAL_RECEIVE", undefined));
    });

    it("should not navigate when already on accounts page", () => {
      mockUseLocation.mockReturnValue({ pathname: "/accounts" });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith("/accounts");
    });

    it("should navigate to accounts when on manager page", () => {
      mockUseLocation.mockReturnValue({ pathname: "/manager" });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
      expect(mockDispatch).toHaveBeenCalledWith(openModal("MODAL_RECEIVE", undefined));
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

      expect(mockOpenSendFlow).toHaveBeenCalled();
    });

    it("should not navigate when already on accounts page", () => {
      mockUseLocation.mockReturnValue({ pathname: "/accounts" });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith("/accounts");
      expect(mockOpenSendFlow).toHaveBeenCalled();
    });

    it("should navigate to accounts when on manager page", () => {
      mockUseLocation.mockReturnValue({ pathname: "/manager" });

      const { result } = renderHook(() => useQuickActions());

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
      expect(mockOpenSendFlow).toHaveBeenCalled();
    });
  });

  describe("memoization", () => {
    it("should return stable action callbacks when dependencies don't change", () => {
      const { result, rerender } = renderHook(() => useQuickActions());

      const firstReceiveAction = result.current.actionsList[0].onAction;
      const firstSendAction = result.current.actionsList[3].onAction;

      rerender();

      const secondReceiveAction = result.current.actionsList[0].onAction;
      const secondSendAction = result.current.actionsList[3].onAction;

      expect(firstReceiveAction).toBe(secondReceiveAction);
      expect(firstSendAction).toBe(secondSendAction);
    });

    it("should update callbacks when location changes", () => {
      mockUseLocation.mockReturnValue({ pathname: "/accounts" });

      const { result, rerender } = renderHook(() => useQuickActions());

      const firstAction = result.current.actionsList[0].onAction;

      mockUseLocation.mockReturnValue({ pathname: "/manager" });

      rerender();

      const secondAction = result.current.actionsList[0].onAction;

      expect(firstAction).not.toBe(secondAction);
    });
  });
});
