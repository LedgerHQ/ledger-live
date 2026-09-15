import { PasswordIncorrectError } from "@ledgerhq/live-common/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { getKey } from "~/renderer/storage";
import { initAccounts } from "~/renderer/actions/accounts";
import { createAccount, injectMockAccounts } from "./utils";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

describe("injectMockAccounts", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "ledger", {
      configurable: true,
      value: { store: { dispatch } },
    });
  });

  it("should reject replacement when persisted accounts are encrypted", async () => {
    jest.mocked(getKey).mockResolvedValue({ status: "encrypted" });

    await expect(injectMockAccounts([], true)).rejects.toBeInstanceOf(PasswordIncorrectError);
    expect(getKey).toHaveBeenCalledWith("app", "accounts", []);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should treat available null as an empty account list", async () => {
    const addedAccount = createAccount(getCryptoCurrencyById("bitcoin"));
    jest.mocked(getKey).mockResolvedValue({ status: "available", data: null });

    await injectMockAccounts([addedAccount]);

    expect(getInitializedAccountIds()).toEqual([addedAccount[0].id]);
  });

  function getInitializedAccountIds(): string[] {
    const thunk = dispatch.mock.calls[0][0] as ReturnType<typeof initAccounts>;
    const innerDispatch = jest.fn();
    thunk(innerDispatch, jest.fn(), undefined);
    const initializeAction = innerDispatch.mock.calls
      .map(([action]) => action)
      .find(action => action.type === "INIT_ACCOUNTS");
    return initializeAction.payload.accounts.map((account: Account) => account.id);
  }
});
