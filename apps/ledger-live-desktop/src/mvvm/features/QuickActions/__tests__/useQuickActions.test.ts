import { renderHook, act } from "tests/testSetup";
import { useQuickActions } from "../hooks/useQuickActions";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useNavigate, useLocation } from "react-router";
import { ArrowDown, Plus, Minus, ArrowUp } from "@ledgerhq/lumen-ui-react/symbols";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";

jest.mock("LLD/features/Send/hooks/useOpenSendFlow");
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow");
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockOpenSendFlow = jest.fn();
const mockOpenAssetFlow = jest.fn();
const mockOpenAddAccountFlow = jest.fn();

const mockOpenURL = openURL as jest.MockedFunction<typeof openURL>;
const mockUseOpenSendFlow = useOpenSendFlow as jest.MockedFunction<typeof useOpenSendFlow>;
const mockUseOpenAssetFlow = useOpenAssetFlow as jest.MockedFunction<typeof useOpenAssetFlow>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;

// Fixtures & Factories
const ethereumCurrency = getCryptoCurrencyById("ethereum");

const createAccountWithFunds = (id = "eth-with-funds"): Account =>
  genAccount(id, {
    currency: ethereumCurrency,
    operationsSize: 1,
  });

const createEmptyAccount = (id = "eth-empty"): Account => {
  const account = genAccount(id, {
    currency: ethereumCurrency,
    operationsSize: 0,
  });
  account.balance = new BigNumber(0);
  account.spendableBalance = new BigNumber(0);
  return account;
};

const createLocation = (pathname: string) => ({
  pathname,
  state: null,
  key: "default",
  search: "",
  hash: "",
});

describe("useQuickActions", () => {
  const trackingPageName = "test_page";

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSendFlow.mockReturnValue(mockOpenSendFlow);
    mockUseOpenAssetFlow.mockReturnValue({
      openAssetFlow: mockOpenAssetFlow,
      openAddAccountFlow: mockOpenAddAccountFlow,
    });
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue(createLocation("/accounts"));
  });

  describe("actions structure", () => {
    it("should return receive action with ArrowDown icon", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const receiveAction = result.current.actionsList[0];
      expect(receiveAction.title).toBe("Receive");
      expect(receiveAction.icon).toBe(ArrowDown);
      expect(receiveAction.disabled).toBe(false);
    });

    it("should return buy action with Plus icon", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const buyAction = result.current.actionsList[1];
      expect(buyAction.title).toBe("Buy");
      expect(buyAction.icon).toBe(Plus);
      expect(buyAction.disabled).toBe(false);
    });

    it("should return sell action with Minus icon", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sellAction = result.current.actionsList[2];
      expect(sellAction.title).toBe("Sell");
      expect(sellAction.icon).toBe(Minus);
    });

    it("should return send action with ArrowUp icon", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sendAction = result.current.actionsList[3];
      expect(sendAction.title).toBe("Send");
      expect(sendAction.icon).toBe(ArrowUp);
      expect(sendAction.disabled).toBe(false);
    });
  });

  describe("sell action disabled state", () => {
    it("should disable sell action when no accounts exist", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(true);
    });

    it("should disable sell action when all accounts are empty", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createEmptyAccount()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(true);
    });

    it("should enable sell action when accounts have funds", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(false);
    });

    it("should enable sell action when at least one account has funds", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createEmptyAccount(), createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sellAction = result.current.actionsList[2];
      expect(sellAction.disabled).toBe(false);
    });
  });

  describe("onReceive action", () => {
    it("should open receive modal when user has accounts", () => {
      const { result, store } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(store.getState().modals).toMatchObject({
        MODAL_RECEIVE: { isOpened: true },
      });
    });

    it("should call openAssetFlow when user has no accounts", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
    });

    it("should not open receive modal when user has no accounts", () => {
      const { result, store } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(store.getState().modals.MODAL_RECEIVE?.isOpened).toBeFalsy();
    });

    it("should not navigate when already on accounts page", () => {
      mockUseLocation.mockReturnValue(createLocation("/accounts"));

      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should navigate to accounts when on manager page", () => {
      mockUseLocation.mockReturnValue(createLocation("/manager"));

      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
    });
  });

  describe("onBuy action", () => {
    it("should navigate to exchange with buy mode", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[1].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { mode: "buy" },
      });
    });
  });

  describe("onSell action", () => {
    it("should navigate to exchange with sell mode", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[2].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/exchange", {
        state: { mode: "sell" },
      });
    });
  });

  describe("onSend action", () => {
    it("should open send flow when triggered", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });

    it("should not navigate when already on accounts page", () => {
      mockUseLocation.mockReturnValue(createLocation("/accounts"));

      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });

    it("should navigate to accounts when on manager page", () => {
      mockUseLocation.mockReturnValue(createLocation("/manager"));

      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      act(() => {
        result.current.actionsList[3].onAction();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/accounts");
      expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    });

    it("should disable send action when no accounts exist", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sendAction = result.current.actionsList[3];
      expect(sendAction.disabled).toBe(true);
    });

    it("should disable send action when user has no funds", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createEmptyAccount()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sendAction = result.current.actionsList[3];
      expect(sendAction.disabled).toBe(true);
    });

    it("should enable send action when user has at least one account with funds", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createEmptyAccount(), createAccountWithFunds()],
          settings: { hasCompletedOnboarding: true },
        },
      });

      const sendAction = result.current.actionsList[3];
      expect(sendAction.disabled).toBe(false);
    });
  });

  describe("when onboarding is not completed", () => {
    it("should return only connect and buy a ledger actions", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: false },
        },
      });

      const actionTitles = result.current.actionsList.map(action => action.title);
      expect(actionTitles).toHaveLength(2);
      expect(actionTitles).toContain("Connect");
      expect(actionTitles).toContain("Buy a Ledger");
    });

    it("should open connect device modal when connect action is triggered", () => {
      const { result, store } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: false },
        },
      });

      act(() => {
        result.current.actionsList[0].onAction();
      });

      expect(store.getState().modals).toMatchObject({
        MODAL_CONNECT_DEVICE: { isOpened: true },
      });
    });

    it("should open ledger shop when buy a ledger action is triggered", () => {
      const { result } = renderHook(() => useQuickActions(trackingPageName), {
        initialState: {
          accounts: [createAccountWithFunds()],
          settings: { hasCompletedOnboarding: false },
        },
      });

      act(() => {
        result.current.actionsList[1].onAction();
      });

      expect(mockOpenURL).toHaveBeenCalledWith(urls.ledgerShop);
    });
  });
});
