import React from "react";
import { act, renderHook } from "tests/testSetup";
import AccountHeaderManageActions from "../AccountHeaderManageActions";
import { createMockMinaAccount, createDelegatingMinaAccount } from "./testUtils";

describe("AccountHeaderManageActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a stake action with earn label when account has no delegation", () => {
    const account = createMockMinaAccount();

    const { result } = renderHook(
      () => AccountHeaderManageActions({ account, parentAccount: undefined }),
      { minimal: false },
    );

    expect(result.current).toHaveLength(1);
    expect(result.current?.[0].key).toBe("Stake");
    expect(result.current?.[0].accountActionsTestId).toBe("stake-button");
    expect(result.current?.[0].disabled).toBe(false);
  });

  it("returns a stake action with change delegation label when account has active delegation", () => {
    const account = createDelegatingMinaAccount();

    const { result } = renderHook(
      () => AccountHeaderManageActions({ account, parentAccount: undefined }),
      { minimal: false },
    );

    expect(result.current).toHaveLength(1);
    expect(result.current?.[0].key).toBe("Stake");
  });

  it("includes correct event properties", () => {
    const account = createMockMinaAccount();

    const { result } = renderHook(
      () => AccountHeaderManageActions({ account, parentAccount: undefined }),
      { minimal: false },
    );

    expect(result.current?.[0].event).toBe("button_clicked2");
    expect(result.current?.[0].eventProperties).toEqual({ button: "stake" });
  });

  it("opens MODAL_MINA_STAKE for the main account when clicked", () => {
    const account = createMockMinaAccount();

    const { result, store } = renderHook(
      () => AccountHeaderManageActions({ account, parentAccount: undefined }),
      { minimal: false },
    );

    act(() => {
      result.current?.[0].onClick();
    });

    expect(store.getState().modals.MODAL_MINA_STAKE).toMatchObject({
      isOpened: true,
      data: { account },
    });
  });
});
