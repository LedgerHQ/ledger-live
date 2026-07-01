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

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    isAccountEmpty: (a: { balance: { isZero: () => boolean } }) => a.balance.isZero(),
  }),
}));

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

    it("stake header action opens the Manage hub", () => {
      const { result, store } = renderHook(() =>
        hook({ account: ALEO_ACCOUNT_1, parentAccount: null }),
      );
      const stakeAction = result.current?.[1];

      act(() => {
        stakeAction?.onClick();
      });

      const modalState = store.getState().modals[AleoCustomModal.MANAGE];

      // The Manage hub always targets the main account (getMainAccount) and
      // Data.parentAccount is optional (Account | undefined), so null is normalized to undefined.
      expect(modalState).toEqual({
        isOpened: true,
        data: { account: ALEO_ACCOUNT_1, parentAccount: undefined },
      });
    });
  });
});
