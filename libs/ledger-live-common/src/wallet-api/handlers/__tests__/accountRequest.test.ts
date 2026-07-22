import type { Account, AccountLike } from "@ledgerhq/types-live";
import { createAccountRequestHandler } from "../accountRequest";
import { getDepsFrom, makeHandlerDeps } from "./testHelpers";
import { createFixtureAccount } from "../../logic/__tests__/testHelpers";
import type { HandlerDeps } from "../types";

jest.mock("../../converters", () => ({
  accountToWalletAPIAccount: jest.fn((_walletState, account) => ({
    id: `wapi:${account.id}`,
  })),
  resolveWalletApiSpendableBalance: jest.fn(),
}));

import { accountToWalletAPIAccount } from "../../converters";

const mockedAccountToWalletAPIAccount = accountToWalletAPIAccount as jest.Mock;

type UiAccountRequest = NonNullable<HandlerDeps["uiAccountRequest"]>;

describe("createAccountRequestHandler", () => {
  beforeEach(() => {
    mockedAccountToWalletAPIAccount.mockClear();
  });

  it("throws when the UI handler is not configured", async () => {
    const handler = createAccountRequestHandler(getDepsFrom(makeHandlerDeps()));

    await expect(handler({})).rejects.toThrow("account.request UI handler not configured");
  });

  it("resolves with the converted account on success and tracks lifecycle", async () => {
    const account = createFixtureAccount("req");
    let captured: Parameters<UiAccountRequest>[0] | undefined;
    const uiAccountRequest: UiAccountRequest = jest.fn(params => {
      captured = params;
    });
    const deps = makeHandlerDeps({ uiAccountRequest });
    const handler = createAccountRequestHandler(getDepsFrom(deps));

    const promise = handler({ currencyIds: ["ethereum"] });

    expect(deps.tracking.requestAccountRequested).toHaveBeenCalledWith(deps.manifest);
    captured!.onSuccess(account, undefined);

    await expect(promise).resolves.toEqual({ id: `wapi:${account.id}` });
    expect(deps.tracking.requestAccountSuccess).toHaveBeenCalledWith(deps.manifest);
    expect(uiAccountRequest).toHaveBeenCalledWith(
      expect.objectContaining({ currencyIds: ["ethereum"] }),
    );
  });

  it("rejects and tracks failure when the user cancels", async () => {
    let captured: Parameters<UiAccountRequest>[0] | undefined;
    const uiAccountRequest: UiAccountRequest = jest.fn(params => {
      captured = params;
    });
    const deps = makeHandlerDeps({ uiAccountRequest });
    const handler = createAccountRequestHandler(getDepsFrom(deps));

    const promise = handler({});
    captured!.onCancel();

    await expect(promise).rejects.toThrow("Canceled by user");
    expect(deps.tracking.requestAccountFail).toHaveBeenCalledWith(deps.manifest);
  });

  it("ignores callbacks fired after the promise has settled", async () => {
    const account = createFixtureAccount("req");
    let captured: Parameters<UiAccountRequest>[0] | undefined;
    const uiAccountRequest: UiAccountRequest = jest.fn(params => {
      captured = params;
    });
    const deps = makeHandlerDeps({ uiAccountRequest });
    const handler = createAccountRequestHandler(getDepsFrom(deps));

    const promise = handler({});
    captured!.onSuccess(account, undefined);
    captured!.onCancel();
    captured!.onSuccess(account, undefined);

    await expect(promise).resolves.toEqual({ id: `wapi:${account.id}` });
    expect(deps.tracking.requestAccountSuccess).toHaveBeenCalledTimes(1);
    expect(deps.tracking.requestAccountFail).not.toHaveBeenCalled();
  });

  it("rejects and tracks failure when the UI handler throws synchronously", async () => {
    const error = new Error("ui boom");
    const uiAccountRequest: UiAccountRequest = jest.fn(() => {
      throw error;
    });
    const deps = makeHandlerDeps({ uiAccountRequest });
    const handler = createAccountRequestHandler(getDepsFrom(deps));

    await expect(handler({})).rejects.toBe(error);
    expect(deps.tracking.requestAccountFail).toHaveBeenCalledWith(deps.manifest);
  });

  it("passes the parentAccount through to the converter", async () => {
    const account = createFixtureAccount("child");
    const parentAccount = createFixtureAccount("parent") as Account;
    let captured: Parameters<UiAccountRequest>[0] | undefined;
    const uiAccountRequest: UiAccountRequest = jest.fn(params => {
      captured = params;
    });
    const deps = makeHandlerDeps({ uiAccountRequest });
    const handler = createAccountRequestHandler(getDepsFrom(deps));

    const promise = handler({});
    captured!.onSuccess(account as AccountLike, parentAccount);
    await promise;

    expect(mockedAccountToWalletAPIAccount).toHaveBeenCalledWith(
      deps.walletState,
      account,
      parentAccount,
    );
  });
});
