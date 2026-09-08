import invariant from "invariant";
import { act } from "react";
import BigNumber from "bignumber.js";
import { renderHook } from "tests/testSetup";
import AccountHeaderActions from "./AccountHeaderManageActions";
import { AleoCustomModal } from "./constants";
import {
  ALEO_ACCOUNT_1,
  ALEO_MAIN_ACCOUNT,
  ALEO_TOKEN_ACCOUNT,
  NEW_ALEO_ACCOUNT,
} from "./__mocks__/account.mock";
import { mockAleoCoinConfig } from "./__mocks__/config.mock";
import { getAleoCurrencyConfig } from "./shared/utils";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    isAccountEmpty: (a: { balance: { isZero: () => boolean } }) => a.balance.isZero(),
  }),
}));

jest.mock("./shared/utils", () => ({
  ...jest.requireActual("./shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

beforeEach(() => {
  mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: false });
});

describe("AccountHeaderManageActions", () => {
  const hook = AccountHeaderActions;
  invariant(hook, "aleo: type guard AccountHeaderActions");

  describe("when account has no balance (empty)", () => {
    it("should return one action that is disabled", () => {
      const { result } = renderHook(() => hook({ account: NEW_ALEO_ACCOUNT, parentAccount: null }));
      const action = result.current?.[0];

      expect(action).not.toBeUndefined();
      expect(action?.disabled).toBe(true);
    });

    it("should include a tooltip when disabled", () => {
      const { result } = renderHook(() => hook({ account: NEW_ALEO_ACCOUNT, parentAccount: null }));
      const action = result.current?.[0];

      expect(action?.tooltip).not.toBeUndefined();
    });

    it("should disable self-transfer for an empty token account", () => {
      const emptyTokenAccount = {
        ...ALEO_TOKEN_ACCOUNT,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
      };

      const { result } = renderHook(() =>
        hook({ account: emptyTokenAccount, parentAccount: ALEO_MAIN_ACCOUNT }),
      );
      const action = result.current?.[0];

      expect(action?.disabled).toBe(true);
    });
  });

  describe("when account has balance", () => {
    it("should return one action that is enabled", () => {
      const { result } = renderHook(() => hook({ account: ALEO_ACCOUNT_1, parentAccount: null }));
      const action = result.current?.[0];

      expect(action?.disabled).toBe(false);
    });

    it("should not include a tooltip when enabled", () => {
      const { result } = renderHook(() => hook({ account: ALEO_ACCOUNT_1, parentAccount: null }));
      const action = result.current?.[0];

      expect(action?.tooltip).toBeUndefined();
    });

    it("should enable self-transfer for a token account with balance", () => {
      const { result } = renderHook(() =>
        hook({ account: ALEO_TOKEN_ACCOUNT, parentAccount: ALEO_MAIN_ACCOUNT }),
      );
      const action = result.current?.[0];

      expect(action?.disabled).toBe(false);
    });

    it("should dispatch openModal with SELF_TRANSFER, account and parentAccount when onClick is called", () => {
      const { result, store } = renderHook(() =>
        hook({ account: ALEO_ACCOUNT_1, parentAccount: null }),
      );
      const action = result.current?.[0];

      act(() => {
        action?.onClick();
      });

      const modalState = store.getState().modals[AleoCustomModal.SELF_TRANSFER];

      expect(modalState).toEqual({
        isOpened: true,
        data: { account: ALEO_ACCOUNT_1, parentAccount: null },
      });
    });

    it("should dispatch openModal with parentAccount for token accounts", () => {
      const { result, store } = renderHook(() =>
        hook({ account: ALEO_TOKEN_ACCOUNT, parentAccount: ALEO_MAIN_ACCOUNT }),
      );
      const action = result.current?.[0];

      act(() => {
        action?.onClick();
      });

      const modalState = store.getState().modals[AleoCustomModal.SELF_TRANSFER];

      expect(modalState).toEqual({
        isOpened: true,
        data: { account: ALEO_TOKEN_ACCOUNT, parentAccount: ALEO_MAIN_ACCOUNT },
      });
    });
  });

  // While enableStaking is off the entry point must be absent rather than merely disabled:
  // a disabled button still advertises a feature that cannot work.
  describe("the Earn action and the enableStaking flag", () => {
    const findEarn = (account = ALEO_ACCOUNT_1, parentAccount: null = null) => {
      const { result } = renderHook(() => hook({ account, parentAccount }));
      return result.current?.find(action => action.key === "AleoBond");
    };

    it("is absent when staking is disabled", () => {
      expect(findEarn()).toBeUndefined();
    });

    it("is absent when the currency config cannot be resolved", () => {
      mockGetAleoCurrencyConfig.mockReturnValue(undefined);

      expect(findEarn()).toBeUndefined();
    });

    it("is present when staking is enabled", () => {
      mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: true });

      expect(findEarn()).toBeDefined();
    });

    it("routes an empty account to the no-funds modal instead of disabling the action", () => {
      mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: true });

      const { result, store } = renderHook(() =>
        hook({ account: NEW_ALEO_ACCOUNT, parentAccount: null }),
      );
      const action = result.current?.find(item => item.key === "AleoBond");

      expect(action?.disabled).toBeFalsy();

      act(() => {
        action?.onClick();
      });

      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE).toEqual({
        isOpened: true,
        data: { account: NEW_ALEO_ACCOUNT },
      });
      expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBeFalsy();
    });

    it("opens the manage modal from an empty token account whose main account has funds", () => {
      mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: true });

      const emptyTokenAccount = {
        ...ALEO_TOKEN_ACCOUNT,
        balance: new BigNumber(0),
        operationsCount: 0,
      };
      const { result, store } = renderHook(() =>
        hook({ account: emptyTokenAccount, parentAccount: ALEO_MAIN_ACCOUNT }),
      );
      const action = result.current?.find(item => item.key === "AleoBond");

      expect(result.current?.find(item => item.key === "Self transfer")?.disabled).toBe(true);
      expect(action?.disabled).toBeFalsy();

      act(() => {
        action?.onClick();
      });

      expect(store.getState().modals[AleoCustomModal.MANAGE]?.isOpened).toBe(true);
      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBeFalsy();
    });

    // The manage modal drives the bond flow off the main account, so a token account must
    // not reach it as the `account` — the bond spends native ALEO. And once the account has
    // been switched, no parent goes with it: forwarding the original would land the same
    // account in both fields, which NoFundsStake passes on to its receive and buy flows.
    it("opens the manage modal on the main account alone, even from a token account", () => {
      mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableStaking: true });

      const { result, store } = renderHook(() =>
        hook({ account: ALEO_TOKEN_ACCOUNT, parentAccount: ALEO_MAIN_ACCOUNT }),
      );
      const action = result.current?.find(item => item.key === "AleoBond");

      act(() => {
        action?.onClick();
      });

      expect(store.getState().modals[AleoCustomModal.MANAGE]).toEqual({
        isOpened: true,
        data: { account: ALEO_MAIN_ACCOUNT },
      });
    });
  });
});
