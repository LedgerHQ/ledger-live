import type { Dispatch, MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit";
import { computeAccountAlias, registerAccountAliases } from "@domain/entity-account-alias";
import type { State } from "../../reducers";
import { createAccountAliasMiddleware, withAccountAliases } from "../accountAlias";

const account = (id: string, subAccounts: { id: string }[] = []) => ({
  type: "Account",
  id,
  subAccounts,
});

const BTC_ID = "js:2:bitcoin:xpub:segwit";
const ETH_ID = "js:2:ethereum:0xdead:";

/** Fake store whose account list moves to the next step every time `next` is called. */
function setup(accountsByStep: unknown[][]) {
  let step = 0;
  const dispatch = jest.fn();
  const getState = jest.fn(() => ({ accounts: accountsByStep[step] }) as unknown as State);
  const api = { dispatch, getState } as unknown as MiddlewareAPI<Dispatch, State>;
  const next = jest.fn(() => {
    step = Math.min(step + 1, accountsByStep.length - 1);
  });
  const middleware = createAccountAliasMiddleware();
  return { dispatch, next, invoke: (action: UnknownAction) => middleware(api)(next)(action) };
}

describe("createAccountAliasMiddleware", () => {
  it("registers aliases when the account list changes", () => {
    const { dispatch, invoke } = setup([[], [account(BTC_ID)]]);

    invoke({ type: "INIT_ACCOUNTS" });

    expect(dispatch).toHaveBeenCalledWith(registerAccountAliases([BTC_ID]));
  });

  it("registers token accounts too", () => {
    const accounts = [account(ETH_ID, [{ id: `${ETH_ID}+usdc` }])];
    const { dispatch, invoke } = setup([[], accounts]);

    invoke({ type: "UPDATE_ACCOUNT" });

    expect(dispatch).toHaveBeenCalledWith(registerAccountAliases([ETH_ID, `${ETH_ID}+usdc`]));
  });

  it("does not re-register when a sync rewrites the accounts without changing their ids", () => {
    const { dispatch, invoke } = setup([[], [account(BTC_ID)], [account(BTC_ID)]]);

    invoke({ type: "INIT_ACCOUNTS" });
    dispatch.mockClear();
    invoke({ type: "UPDATE_ACCOUNT" });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing when the account list is untouched", () => {
    const accounts = [account(BTC_ID)];
    const { dispatch, invoke } = setup([accounts]);

    invoke({ type: "FIRST" });
    dispatch.mockClear();
    invoke({ type: "SOME_UNRELATED_ACTION" });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("passes the action down the chain", () => {
    const { next, invoke } = setup([[]]);
    const action = { type: "ANY" };

    invoke(action);

    expect(next).toHaveBeenCalledWith(action);
  });
});

describe("withAccountAliases", () => {
  it("seeds the reverse map from preloaded accounts", () => {
    const state = { accounts: [account(BTC_ID, [{ id: `${BTC_ID}+token` }])] } as unknown as State;

    expect(withAccountAliases(state)?.accountAliases.accountIdByAlias).toEqual({
      [computeAccountAlias(BTC_ID)]: BTC_ID,
      [computeAccountAlias(`${BTC_ID}+token`)]: `${BTC_ID}+token`,
    });
  });

  it("copes with a partial state that carries no accounts", () => {
    expect(withAccountAliases({} as State)?.accountAliases.accountIdByAlias).toEqual({});
  });

  it("copes with a hand-built state whose accounts are not an array", () => {
    const state = { accounts: { active: [account(BTC_ID)] } } as unknown as State;

    expect(withAccountAliases(state)?.accountAliases.accountIdByAlias).toEqual({});
  });

  it("passes undefined through", () => {
    expect(withAccountAliases(undefined)).toBeUndefined();
  });
});
