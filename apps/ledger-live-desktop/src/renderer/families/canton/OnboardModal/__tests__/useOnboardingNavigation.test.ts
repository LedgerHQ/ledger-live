import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { act, renderHook } from "tests/testSetup";
import type { NavigationSnapshot } from "../../hooks/topologyChangeError";
import { useOnboardingNavigation } from "../hooks/useOnboardingNavigation";
import {
  createMockAccount,
  createMockCantonCurrency,
  createMockOnboardingResult,
} from "./testUtils";

jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(() => ({
    type: "ADD_ACCOUNTS",
    payload: {
      allAccounts: [],
      editedNames: new Map(),
    },
  })),
}));
const mockAddAccountsAction = addAccountsAction as jest.MockedFunction<typeof addAccountsAction>;

describe("useOnboardingNavigation", () => {
  const mockCurrency = createMockCantonCurrency();
  const mockAccount = createMockAccount({ used: false });
  const mockImportable = createMockAccount({ id: "imp-1", used: true });

  const initialState = {
    modals: {
      MODAL_CANTON_ONBOARD_ACCOUNT: { isOpened: true },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleAddAccounts", () => {
    it("should dispatch addAccountsAction and close modal", () => {
      const onboardingResult = createMockOnboardingResult();
      const { result, store } = renderHook(
        () =>
          useOnboardingNavigation({
            currency: mockCurrency,
            selectedAccounts: [mockImportable, mockAccount],
            existingAccounts: [],
            editedNames: {},
            onboardingResult,
          }),
        { initialState },
      );

      act(() => {
        result.current.handleAddAccounts();
      });

      expect(mockAddAccountsAction).toHaveBeenCalledWith(
        expect.objectContaining({
          scannedAccounts: expect.any(Array),
          existingAccounts: [],
          selectedIds: expect.any(Array),
          renamings: expect.any(Object),
        }),
      );
      expect(store.getState().modals.MODAL_CANTON_ONBOARD_ACCOUNT?.isOpened).toBe(false);
    });

    it("should restore modal snapshot after reonboarding", () => {
      const accountToReonboard = createMockAccount({ id: "reonboard", used: true });
      const onboardingResult = createMockOnboardingResult();
      const navigationSnapshot: NavigationSnapshot = {
        type: "modal",
        modalName: "MODAL_SEND",
        modalData: { account: accountToReonboard },
      };

      const { result, store } = renderHook(
        () =>
          useOnboardingNavigation({
            currency: mockCurrency,
            selectedAccounts: [accountToReonboard],
            existingAccounts: [],
            editedNames: {},
            isReonboarding: true,
            accountToReonboard,
            navigationSnapshot,
            onboardingResult,
          }),
        { initialState },
      );

      act(() => {
        result.current.handleAddAccounts();
      });

      expect(store.getState().modals.MODAL_CANTON_ONBOARD_ACCOUNT?.isOpened).toBe(false);
      expect(store.getState().modals.MODAL_SEND?.isOpened).toBe(true);
    });

    it("should restore transfer-proposal snapshot after reonboarding", () => {
      const accountToReonboard = createMockAccount({ id: "reonboard", used: true });
      const onboardingResult = createMockOnboardingResult();
      const mockHandler = jest.fn();
      const navigationSnapshot: NavigationSnapshot = {
        type: "transfer-proposal",
        handler: mockHandler,
        props: {
          action: "accept",
          contractId: "contract-123",
        },
      };

      const { result, store } = renderHook(
        () =>
          useOnboardingNavigation({
            currency: mockCurrency,
            selectedAccounts: [accountToReonboard],
            existingAccounts: [],
            editedNames: {},
            isReonboarding: true,
            accountToReonboard,
            navigationSnapshot,
            onboardingResult,
          }),
        { initialState },
      );

      act(() => {
        result.current.handleAddAccounts();
      });

      expect(store.getState().modals.MODAL_CANTON_ONBOARD_ACCOUNT?.isOpened).toBe(false);
      expect(mockHandler).toHaveBeenCalledWith("contract-123", "accept");
    });

    it("should not restore snapshot when not reonboarding", () => {
      const onboardingResult = createMockOnboardingResult();
      const { result, store } = renderHook(
        () =>
          useOnboardingNavigation({
            currency: mockCurrency,
            selectedAccounts: [mockAccount],
            existingAccounts: [],
            editedNames: {},
            onboardingResult,
          }),
        { initialState },
      );

      act(() => {
        result.current.handleAddAccounts();
      });

      expect(store.getState().modals.MODAL_CANTON_ONBOARD_ACCOUNT?.isOpened).toBe(false);
      expect(store.getState().modals.MODAL_SEND).toBeUndefined();
    });
  });

  describe("handleAddMore", () => {
    it("should add accounts then open add accounts modal", () => {
      const onboardingResult = createMockOnboardingResult();
      const { result, store } = renderHook(
        () =>
          useOnboardingNavigation({
            currency: mockCurrency,
            selectedAccounts: [mockAccount],
            existingAccounts: [],
            editedNames: {},
            onboardingResult,
          }),
        { initialState },
      );

      act(() => {
        result.current.handleAddMore();
      });

      expect(store.getState().modals.MODAL_CANTON_ONBOARD_ACCOUNT?.isOpened).toBe(false);
      expect(store.getState().modals.MODAL_ADD_ACCOUNTS?.isOpened).toBe(true);
    });
  });
});
