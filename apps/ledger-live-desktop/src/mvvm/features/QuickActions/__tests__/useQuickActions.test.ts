import { renderHook } from "@testing-library/react";
import { useQuickActions } from "../hooks/useQuickActions";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";

jest.mock("LLD/features/Send/hooks/useOpenSendFlow");
jest.mock("~/renderer/actions/modals");
jest.mock("LLD/hooks/redux");
jest.mock("react-router");

const mockUseOpenSendFlow = useOpenSendFlow as jest.MockedFunction<typeof useOpenSendFlow>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

describe("useQuickActions", () => {
  const mockOpenSendFlow = jest.fn();
  const mockDispatch = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockUseOpenSendFlow.mockReturnValue(mockOpenSendFlow);
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({
      pathname: "/accounts",
      search: "",
      hash: "",
      state: null,
      key: "default",
    });
    jest.clearAllMocks();
  });

  describe("onSend", () => {
    it("opens send flow", () => {
      const { result } = renderHook(() => useQuickActions());

      result.current.onSend();

      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });

    it("redirects to accounts when on manager page", () => {
      mockUseLocation.mockReturnValue({
        pathname: "/manager",
        search: "",
        hash: "",
        state: null,
        key: "default",
      });

      const { result } = renderHook(() => useQuickActions());

      result.current.onSend();

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });

    it("does not redirect when already on accounts page", () => {
      const { result } = renderHook(() => useQuickActions());

      result.current.onSend();

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });
  });

  describe("onReceive", () => {
    it("opens receive modal", () => {
      const { result } = renderHook(() => useQuickActions());

      result.current.onReceive();

      expect(mockDispatch).toHaveBeenCalledWith(openModal("MODAL_RECEIVE", undefined));
    });

    it("redirects to accounts when on manager page", () => {
      mockUseLocation.mockReturnValue({
        pathname: "/manager",
        search: "",
        hash: "",
        state: null,
        key: "default",
      });

      const { result } = renderHook(() => useQuickActions());

      result.current.onReceive();

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
      expect(mockDispatch).toHaveBeenCalledWith(openModal("MODAL_RECEIVE", undefined));
    });
  });

  describe("onBuy", () => {
    it("navigates to exchange with buy mode", () => {
      const { result } = renderHook(() => useQuickActions());

      result.current.onBuy();

      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: {
          mode: "buy",
        },
      });
    });
  });

  describe("onSell", () => {
    it("navigates to exchange with sell mode", () => {
      const { result } = renderHook(() => useQuickActions());

      result.current.onSell();

      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: {
          mode: "sell",
        },
      });
    });
  });

  describe("push helper", () => {
    it("does not navigate when already on target pathname", () => {
      mockUseLocation.mockReturnValue({
        pathname: "/accounts",
        search: "",
        hash: "",
        state: null,
        key: "default",
      });

      const { result } = renderHook(() => useQuickActions());

      result.current.onSend();

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates when on different pathname", () => {
      mockUseLocation.mockReturnValue({
        pathname: "/manager",
        search: "",
        hash: "",
        state: null,
        key: "default",
      });

      const { result } = renderHook(() => useQuickActions());

      result.current.onSend();

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
    });
  });
});
