jest.mock("../coin-modules/registry", () => ({
  loadIsAccountEmptyForFamily: jest.fn(),
  loadClearAccountForFamily: jest.fn(),
  loadGetVotesCountForFamily: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/account", () => ({
  clearAccount: (account: any, cb: any) => { cb(account); return account; },
  isAccountEmpty: jest.fn(() => false),
  getMainAccount: (a: any) => a,
}));
jest.mock("@ledgerhq/cryptoassets/state", () => ({}));

import {
  loadIsAccountEmptyForFamily,
  loadClearAccountForFamily,
  loadGetVotesCountForFamily,
} from "../coin-modules/registry";
import { isAccountEmpty, clearAccount, getVotesCount } from "./helpers";

const mockAccount = { type: "Account", currency: { family: "evm" } } as any;

beforeEach(() => jest.clearAllMocks());

describe("isAccountEmpty", () => {
  it("delegates to loader for Account type", () => {
    const fn = jest.fn(() => true);
    (loadIsAccountEmptyForFamily as jest.Mock).mockReturnValue(fn);
    expect(isAccountEmpty(mockAccount)).toBe(true);
    expect(loadIsAccountEmptyForFamily).toHaveBeenCalledWith("evm");
    expect(fn).toHaveBeenCalledWith(mockAccount);
  });

  it("falls back to common when no loader", () => {
    (loadIsAccountEmptyForFamily as jest.Mock).mockReturnValue(undefined);
    isAccountEmpty(mockAccount);
    expect(loadIsAccountEmptyForFamily).toHaveBeenCalledWith("evm");
  });
});

describe("clearAccount", () => {
  it("calls loader clearAccount fn", () => {
    const fn = jest.fn();
    (loadClearAccountForFamily as jest.Mock).mockReturnValue(fn);
    clearAccount(mockAccount);
    expect(loadClearAccountForFamily).toHaveBeenCalledWith("evm");
    expect(fn).toHaveBeenCalledWith(mockAccount);
  });
});

describe("getVotesCount", () => {
  it("delegates to loader", () => {
    const fn = jest.fn(() => 3);
    (loadGetVotesCountForFamily as jest.Mock).mockReturnValue(fn);
    expect(getVotesCount(mockAccount)).toBe(3);
    expect(loadGetVotesCountForFamily).toHaveBeenCalledWith("evm");
  });

  it("returns 0 when no loader", () => {
    (loadGetVotesCountForFamily as jest.Mock).mockReturnValue(undefined);
    expect(getVotesCount(mockAccount)).toBe(0);
  });
});
