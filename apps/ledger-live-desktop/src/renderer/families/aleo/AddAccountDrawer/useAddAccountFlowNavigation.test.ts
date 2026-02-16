import { renderHook } from "@testing-library/react";
import { act } from "tests/testSetup";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import { WARNING_REASON } from "LLD/features/AddAccountDrawer/domain";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { setDrawer } from "~/renderer/drawers/Provider";
import { ALEO_ACCOUNT_1, ALEO_ACCOUNT_2 } from "~/renderer/families/aleo/__mocks__/account.mock";
import { ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "./domain";
import { useAddAccountFlowNavigation } from "./useAddAccountFlowNavigation";
import { useNavigation } from "./useNavigation";

jest.mock("./useNavigation");
jest.mock("LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics");
jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

const mockGoToStep = jest.fn();
const mockTrackAddAccountEvent = jest.fn();

describe("useAddAccountFlowNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useNavigation as jest.Mock).mockReturnValue({
      currentStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME,
      navigationDirection: "forward",
      goToStep: mockGoToStep,
    });

    (useAddAccountAnalytics as jest.Mock).mockReturnValue({
      trackAddAccountEvent: mockTrackAddAccountEvent,
    });
  });

  describe("navigateToWarningScreen", () => {
    it("should navigate with warning reason and empty account", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      act(() => {
        result.current.navigateToWarningScreen(
          WARNING_REASON.ALREADY_EMPTY_ACCOUNT,
          ALEO_ACCOUNT_1,
        );
      });

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(
        ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING,
      );
      expect(result.current.warningReason).toBe(WARNING_REASON.ALREADY_EMPTY_ACCOUNT);
      expect(result.current.emptyAccount).toBe(ALEO_ACCOUNT_1);
    });

    it("should navigate without setting warning state when parameters not provided", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      act(() => {
        result.current.navigateToWarningScreen();
      });

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(
        ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING,
      );
      expect(result.current.warningReason).toBeUndefined();
      expect(result.current.emptyAccount).toBeUndefined();
    });
  });

  describe("navigateBack", () => {
    describe("from EDIT_ACCOUNT_NAME step", () => {
      beforeEach(() => {
        (useNavigation as jest.Mock).mockReturnValue({
          currentStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME,
          navigationDirection: "forward",
          goToStep: mockGoToStep,
        });
      });

      it("should navigate to warning screen when no accounts selected", () => {
        const { result } = renderHook(() =>
          useAddAccountFlowNavigation({
            selectedAccounts: [],
          }),
        );

        result.current.navigateBack?.();

        expect(mockGoToStep).toHaveBeenCalledTimes(1);
        expect(mockGoToStep).toHaveBeenCalledWith(
          ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING,
        );
        expect(mockTrackAddAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackAddAccountEvent).toHaveBeenCalledWith(
          ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED,
          expect.objectContaining({
            button: "Back",
            page: ADD_ACCOUNT_PAGE_NAME.EDIT_ACCOUNT_NAME_ACTIONS,
            flow: ADD_ACCOUNT_FLOW_NAME,
          }),
        );
      });

      it("should navigate to accounts added when accounts are selected", () => {
        const { result } = renderHook(() =>
          useAddAccountFlowNavigation({
            selectedAccounts: [ALEO_ACCOUNT_1],
          }),
        );

        result.current.navigateBack?.();

        expect(mockGoToStep).toHaveBeenCalledTimes(1);
        expect(mockGoToStep).toHaveBeenCalledWith(
          ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED,
        );
        expect(mockTrackAddAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackAddAccountEvent).toHaveBeenCalledWith(
          ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED,
          expect.objectContaining({
            button: "Back",
            page: ADD_ACCOUNT_PAGE_NAME.EDIT_ACCOUNT_NAME_ACTIONS,
            flow: ADD_ACCOUNT_FLOW_NAME,
          }),
        );
      });
    });

    describe("from FUND_ACCOUNT step", () => {
      beforeEach(() => {
        (useNavigation as jest.Mock).mockReturnValue({
          currentStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT,
          navigationDirection: "forward",
          goToStep: mockGoToStep,
        });
      });

      it("should navigate to warning screen when no accounts selected", () => {
        const { result } = renderHook(() =>
          useAddAccountFlowNavigation({
            selectedAccounts: [],
          }),
        );

        result.current.navigateBack?.();

        expect(mockGoToStep).toHaveBeenCalledTimes(1);
        expect(mockGoToStep).toHaveBeenCalledWith(
          ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING,
        );
        expect(mockTrackAddAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackAddAccountEvent).toHaveBeenCalledWith(
          ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED,
          expect.objectContaining({
            button: "Back",
            page: ADD_ACCOUNT_PAGE_NAME.FUNDING_ACTIONS,
            flow: ADD_ACCOUNT_FLOW_NAME,
          }),
        );
      });

      it("should navigate to accounts added when one account is selected", () => {
        const { result } = renderHook(() =>
          useAddAccountFlowNavigation({
            selectedAccounts: [ALEO_ACCOUNT_1],
          }),
        );

        result.current.navigateBack?.();

        expect(mockGoToStep).toHaveBeenCalledTimes(1);
        expect(mockGoToStep).toHaveBeenCalledWith(
          ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED,
        );
        expect(mockTrackAddAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackAddAccountEvent).toHaveBeenCalledWith(
          ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED,
          expect.objectContaining({
            button: "Back",
            page: ADD_ACCOUNT_PAGE_NAME.FUNDING_ACTIONS,
            flow: ADD_ACCOUNT_FLOW_NAME,
          }),
        );
      });

      it("should navigate to select account when multiple accounts are selected", () => {
        const { result } = renderHook(() =>
          useAddAccountFlowNavigation({
            selectedAccounts: [ALEO_ACCOUNT_1, ALEO_ACCOUNT_2],
          }),
        );

        result.current.navigateBack?.();

        expect(mockGoToStep).toHaveBeenCalledTimes(1);
        expect(mockGoToStep).toHaveBeenCalledWith(
          ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT,
        );
        expect(mockTrackAddAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackAddAccountEvent).toHaveBeenCalledWith(
          ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED,
          expect.objectContaining({
            button: "Back",
            page: ADD_ACCOUNT_PAGE_NAME.FUNDING_ACTIONS,
            flow: ADD_ACCOUNT_FLOW_NAME,
          }),
        );
      });
    });

    describe("from SELECT_ACCOUNT step", () => {
      beforeEach(() => {
        (useNavigation as jest.Mock).mockReturnValue({
          currentStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT,
          navigationDirection: "forward",
          goToStep: mockGoToStep,
        });
      });

      it("should navigate to accounts added", () => {
        const { result } = renderHook(() =>
          useAddAccountFlowNavigation({
            selectedAccounts: [ALEO_ACCOUNT_1],
          }),
        );

        result.current.navigateBack?.();

        expect(mockGoToStep).toHaveBeenCalledTimes(1);
        expect(mockGoToStep).toHaveBeenCalledWith(
          ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED,
        );
        expect(mockTrackAddAccountEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackAddAccountEvent).toHaveBeenCalledWith(
          ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED,
          expect.objectContaining({
            button: "Back",
            page: ADD_ACCOUNT_PAGE_NAME.FUND_ACCOUNT_DRAWER_LIST,
            flow: ADD_ACCOUNT_FLOW_NAME,
          }),
        );
      });
    });

    it("should return undefined for steps without back navigation", () => {
      (useNavigation as jest.Mock).mockReturnValue({
        currentStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS,
        navigationDirection: "forward",
        goToStep: mockGoToStep,
      });

      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [ALEO_ACCOUNT_1],
        }),
      );

      expect(result.current.navigateBack).toBeUndefined();
    });
  });

  describe("navigateToFundAccount", () => {
    beforeEach(() => {
      (useNavigation as jest.Mock).mockReturnValue({
        currentStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME,
        navigationDirection: "forward",
        goToStep: mockGoToStep,
      });
    });

    it("should call onAccountSelected callback when provided", () => {
      const mockOnAccountSelected = jest.fn();

      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [ALEO_ACCOUNT_1],
          onAccountSelected: mockOnAccountSelected,
        }),
      );

      result.current.navigateToFundAccount(ALEO_ACCOUNT_1);

      expect(mockOnAccountSelected).toHaveBeenCalledTimes(1);
      expect(mockOnAccountSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          id: ALEO_ACCOUNT_1.id,
        }),
        undefined,
      );
      expect(mockGoToStep).not.toHaveBeenCalled();
    });

    it("should navigate to fund account step when no callback provided", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [ALEO_ACCOUNT_1],
        }),
      );

      result.current.navigateToFundAccount(ALEO_ACCOUNT_1);

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT);
    });
  });

  describe("forward navigation", () => {
    beforeEach(() => {
      (useNavigation as jest.Mock).mockReturnValue({
        currentStep: ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
        navigationDirection: "forward",
        goToStep: mockGoToStep,
      });
    });

    it("navigateToConnectDevice should navigate to connect device step", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      result.current.navigateToConnectDevice();

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(
        ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE,
      );
    });

    it("navigateToViewKeyWarning should navigate to view key warning step", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      result.current.navigateToViewKeyWarning();

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(
        ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.VIEW_KEY_WARNING,
      );
    });

    it("navigateToViewKeyApprove should navigate to view key approve step", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      result.current.navigateToViewKeyApprove();

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(
        ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.VIEW_KEY_APPROVE,
      );
    });

    it("navigateToScanAccounts should navigate to scan accounts step", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      result.current.navigateToScanAccounts();

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS);
    });

    it("navigateToSelectAccount should navigate to select account step", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      result.current.navigateToSelectAccount();

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(
        ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT,
      );
    });

    it("navigateToAccountsAdded should navigate to accounts added step", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      result.current.navigateToAccountsAdded();

      expect(mockGoToStep).toHaveBeenCalledTimes(1);
      expect(mockGoToStep).toHaveBeenCalledWith(
        ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED,
      );
    });
  });

  describe("closeDrawer", () => {
    it("should close the drawer", () => {
      const { result } = renderHook(() =>
        useAddAccountFlowNavigation({
          selectedAccounts: [],
        }),
      );

      result.current.closeDrawer();

      expect(setDrawer).toHaveBeenCalledTimes(1);
      expect(setDrawer).toHaveBeenCalledWith();
    });
  });
});
