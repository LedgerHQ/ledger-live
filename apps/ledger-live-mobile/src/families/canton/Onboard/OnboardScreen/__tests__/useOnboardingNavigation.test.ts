/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { act, renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { useOnboardingNavigation } from "../hooks/useOnboardingNavigation";
import {
  createMockAccount,
  createMockCurrency,
  createMockNavigation,
  createMockOnboardResult,
} from "./test-utils";

describe("useOnboardingNavigation", () => {
  const mockDispatch = jest.fn();
  const mockParentNavigate = jest.fn();
  const mockRestoreNavigationSnapshot = jest.fn();
  const mockNavigation = {
    ...createMockNavigation(),
    getParent: jest.fn(() => ({
      navigate: mockParentNavigate,
    })),
  };
  const mockCryptoCurrency = createMockCurrency();
  const mockExistingAccounts = [createMockAccount({ id: "existing-1" })];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("navigateToSuccess", () => {
    it("should navigate to AddAccountsSuccess screen", () => {
      const accountsToAdd = [createMockAccount({ id: "new-1" })];
      const mockRoute = { params: {} };

      const { result } = renderHook(() =>
        useOnboardingNavigation({
          navigation: mockNavigation as any,
          route: mockRoute as any,
          accountsToAdd,
          cryptoCurrency: mockCryptoCurrency,
          dispatch: mockDispatch,
          existingAccounts: mockExistingAccounts,
          restoreNavigationSnapshot: mockRestoreNavigationSnapshot,
        }),
      );

      act(() => {
        result.current.navigateToSuccess();
      });

      expect(mockNavigation.getParent).toHaveBeenCalled();
      expect(mockParentNavigate).toHaveBeenCalledWith(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsSuccess,
        params: {
          accountsToAdd,
          currency: mockCryptoCurrency,
        },
      });
    });
  });

  describe("finishOnboarding", () => {
    it("should dispatch addAccountsAction for normal onboarding", () => {
      const accountsToAdd = [
        createMockAccount({ id: "new-1", used: true }),
        createMockAccount({ id: "new-2", used: false }),
      ];
      const onboardResult = createMockOnboardResult({
        account: createMockAccount({ id: "onboarded-1" }),
        partyId: "party-123",
      });
      const mockRoute = { params: {} };

      const { result } = renderHook(() =>
        useOnboardingNavigation({
          navigation: mockNavigation as any,
          route: mockRoute as any,
          accountsToAdd,
          cryptoCurrency: mockCryptoCurrency,
          dispatch: mockDispatch,
          existingAccounts: mockExistingAccounts,
          restoreNavigationSnapshot: mockRestoreNavigationSnapshot,
        }),
      );

      act(() => {
        result.current.finishOnboarding(onboardResult);
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        addAccountsAction({
          existingAccounts: mockExistingAccounts,
          scannedAccounts: [createMockAccount({ id: "new-1", used: true }), onboardResult.account],
          selectedIds: ["new-1", onboardResult.account.id],
          renamings: {},
        }),
      );
      expect(mockParentNavigate).toHaveBeenCalled();
    });

    it("should navigate to success screen for normal onboarding", () => {
      const accountsToAdd = [createMockAccount({ id: "new-1", used: true })];
      const onboardResult = createMockOnboardResult();
      const mockRoute = { params: {} };

      const { result } = renderHook(() =>
        useOnboardingNavigation({
          navigation: mockNavigation as any,
          route: mockRoute as any,
          accountsToAdd,
          cryptoCurrency: mockCryptoCurrency,
          dispatch: mockDispatch,
          existingAccounts: mockExistingAccounts,
          restoreNavigationSnapshot: mockRestoreNavigationSnapshot,
        }),
      );

      act(() => {
        result.current.finishOnboarding(onboardResult);
      });

      expect(mockParentNavigate).toHaveBeenCalledWith(NavigatorName.AddAccounts, {
        screen: ScreenName.AddAccountsSuccess,
        params: {
          accountsToAdd,
          currency: mockCryptoCurrency,
        },
      });
    });

    it("should merge account data for reonboarding", () => {
      const accountToReonboard = createMockAccount({
        id: "reonboard-1",
        balance: { toNumber: () => 100 },
      } as any);
      const onboardResult = createMockOnboardResult({
        account: createMockAccount({ id: "onboarded-1" }),
        partyId: "party-123",
      });
      const accountsToAdd = [createMockAccount({ id: "other-1" })];
      const mockRoute = {
        params: {
          isReonboarding: true,
          accountToReonboard,
        },
      };

      const { result } = renderHook(() =>
        useOnboardingNavigation({
          navigation: mockNavigation as any,
          route: mockRoute as any,
          accountsToAdd,
          cryptoCurrency: mockCryptoCurrency,
          dispatch: mockDispatch,
          existingAccounts: mockExistingAccounts,
          restoreNavigationSnapshot: mockRestoreNavigationSnapshot,
        }),
      );

      act(() => {
        result.current.finishOnboarding(onboardResult);
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        addAccountsAction({
          existingAccounts: mockExistingAccounts,
          scannedAccounts: [
            {
              ...accountToReonboard,
              ...onboardResult.account,
              id: accountToReonboard.id,
            },
          ],
          selectedIds: [accountToReonboard.id],
          renamings: {},
        }),
      );
    });

    it("should restore navigation snapshot for reonboarding with restoreState", () => {
      const accountToReonboard = createMockAccount({ id: "reonboard-1" });
      const onboardResult = createMockOnboardResult();
      const restoreState = { some: "state" };
      const mockRoute = {
        params: {
          isReonboarding: true,
          accountToReonboard,
          restoreState,
        },
      };

      const { result } = renderHook(() =>
        useOnboardingNavigation({
          navigation: mockNavigation as any,
          route: mockRoute as any,
          accountsToAdd: [],
          cryptoCurrency: mockCryptoCurrency,
          dispatch: mockDispatch,
          existingAccounts: mockExistingAccounts,
          restoreNavigationSnapshot: mockRestoreNavigationSnapshot,
        }),
      );

      act(() => {
        result.current.finishOnboarding(onboardResult);
      });

      expect(mockRestoreNavigationSnapshot).toHaveBeenCalledWith(mockNavigation, restoreState);
      expect(mockNavigation.goBack).not.toHaveBeenCalled();
    });

    it("should go back for reonboarding without restoreState", () => {
      const accountToReonboard = createMockAccount({ id: "reonboard-1" });
      const onboardResult = createMockOnboardResult();
      const mockRoute = {
        params: {
          isReonboarding: true,
          accountToReonboard,
        },
      };

      const { result } = renderHook(() =>
        useOnboardingNavigation({
          navigation: mockNavigation as any,
          route: mockRoute as any,
          accountsToAdd: [],
          cryptoCurrency: mockCryptoCurrency,
          dispatch: mockDispatch,
          existingAccounts: mockExistingAccounts,
          restoreNavigationSnapshot: mockRestoreNavigationSnapshot,
        }),
      );

      act(() => {
        result.current.finishOnboarding(onboardResult);
      });

      expect(mockNavigation.goBack).toHaveBeenCalled();
      expect(mockRestoreNavigationSnapshot).not.toHaveBeenCalled();
    });
  });
});
