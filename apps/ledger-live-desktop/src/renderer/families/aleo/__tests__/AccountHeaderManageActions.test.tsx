import invariant from "invariant";
import { act } from "react";
import type { TokenAccount } from "@ledgerhq/types-live";
import { renderHook } from "tests/testSetup";
import AccountHeaderActions from "../AccountHeaderManageActions";
import { AleoCustomModal } from "../constants";
import { ALEO_ACCOUNT_1, NEW_ALEO_ACCOUNT } from "../__mocks__/account.mock";

describe("AccountHeaderManageActions", () => {
  const hook = AccountHeaderActions;
  invariant(hook, "aleo: type guard AccountHeaderActions");

  describe("when account is not of type Account", () => {
    it("should return an empty array", () => {
      const tokenAccount = { ...ALEO_ACCOUNT_1, type: "TokenAccount" } as unknown as TokenAccount;
      const { result } = renderHook(() => hook({ account: tokenAccount, parentAccount: null }));

      expect(result.current).toEqual([]);
    });
  });

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

    it("should dispatch openModal with SELF_TRANSFER and account when onClick is called", () => {
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
        data: { account: ALEO_ACCOUNT_1 },
      });
    });
  });
});
