import { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { cleanAccountsCache, replaceAccounts } from "../accounts";
import type { State } from "~/renderer/reducers";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const mockedGetAccountBridge = jest.mocked(getAccountBridge);

type ThunkAction = ReturnType<typeof replaceAccounts>;

const makeHarness = (accounts: Account[]) => {
  const dispatched: ThunkAction[] = [];
  const dispatch = <T extends ThunkAction>(action: T): T => {
    dispatched.push(action);
    return action;
  };
  const getState = () => ({ accounts }) as unknown as State;
  return { dispatched, dispatch, getState };
};

describe("cleanAccountsCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dispatches replaceAccounts with each account cleared via its own bridge", async () => {
    const account1 = { id: "1", balance: 100 } as unknown as Account;
    const account2 = { id: "2", balance: 200 } as unknown as Account;
    const cleared1 = { id: "1", balance: 0 } as unknown as Account;
    const cleared2 = { id: "2", balance: 0 } as unknown as Account;

    const clearAccount1 = jest.fn().mockReturnValue(cleared1);
    const clearAccount2 = jest.fn().mockReturnValue(cleared2);

    mockedGetAccountBridge.mockImplementation(account => {
      const clearAccount = account.id === "1" ? clearAccount1 : clearAccount2;
      return { clearAccount } as unknown as ReturnType<typeof getAccountBridge>;
    });

    const { dispatched, dispatch, getState } = makeHarness([account1, account2]);
    await cleanAccountsCache()(dispatch, getState, undefined);

    expect(mockedGetAccountBridge).toHaveBeenCalledTimes(2);
    expect(clearAccount1).toHaveBeenCalledWith(account1);
    expect(clearAccount2).toHaveBeenCalledWith(account2);
    expect(dispatched).toEqual([replaceAccounts([cleared1, cleared2])]);
  });

  it("dispatches replaceAccounts with an empty array when there are no accounts", async () => {
    const { dispatched, dispatch, getState } = makeHarness([]);

    await cleanAccountsCache()(dispatch, getState, undefined);

    expect(mockedGetAccountBridge).not.toHaveBeenCalled();
    expect(dispatched).toEqual([replaceAccounts([])]);
  });
});
