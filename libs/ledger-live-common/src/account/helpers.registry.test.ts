jest.mock("../bridge", () => ({
  getAccountBridge: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/account", () => ({
  clearAccount: jest.fn(account => account),
  isAccountEmpty: jest.fn(() => false),
  getMainAccount: (a: any) => a,
}));
jest.mock("@ledgerhq/cryptoassets/state", () => ({}));

import { getAccountBridge } from "../bridge";
import { isAccountEmpty, clearAccount, getVotesCount } from "./helpers";

const makeMockBridge = (overrides = {}) => ({
  isAccountEmpty: undefined,
  clearAccount: undefined,
  getStakesCount: undefined,
  ...overrides,
});

const mockAccount = { type: "Account", currency: { family: "evm" } } as any;

beforeEach(() => jest.clearAllMocks());

describe("isAccountEmpty", () => {
  it("delegates to bridge method for Account type", () => {
    const fn = jest.fn(() => true);
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge({ isAccountEmpty: fn }));
    expect(isAccountEmpty(mockAccount)).toBe(true);
    expect(getAccountBridge).toHaveBeenCalledWith(mockAccount);
    expect(fn).toHaveBeenCalledWith(mockAccount);
  });

  it("falls back to common when bridge has no method", () => {
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge());
    isAccountEmpty(mockAccount);
    expect(getAccountBridge).toHaveBeenCalledWith(mockAccount);
  });

  it("falls back to common when getAccountBridge throws", () => {
    (getAccountBridge as jest.Mock).mockImplementation(() => { throw new Error("not supported"); });
    expect(isAccountEmpty(mockAccount)).toBe(false);
  });
});

describe("clearAccount", () => {
  it("delegates to bridge clearAccount when present", () => {
    const fn = jest.fn(account => account);
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge({ clearAccount: fn }));
    clearAccount(mockAccount);
    expect(getAccountBridge).toHaveBeenCalledWith(mockAccount);
    expect(fn).toHaveBeenCalledWith(mockAccount);
  });

  it("falls back to common when bridge has no method", () => {
    const { clearAccount: commonClearAccount } = require("@ledgerhq/ledger-wallet-framework/account");
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge());
    clearAccount(mockAccount);
    expect(commonClearAccount).toHaveBeenCalledWith(mockAccount);
  });

  it("falls back to common when getAccountBridge throws", () => {
    const { clearAccount: commonClearAccount } = require("@ledgerhq/ledger-wallet-framework/account");
    (getAccountBridge as jest.Mock).mockImplementation(() => { throw new Error("not supported"); });
    clearAccount(mockAccount);
    expect(commonClearAccount).toHaveBeenCalledWith(mockAccount);
  });
});

describe("getVotesCount", () => {
  it("delegates to bridge getStakesCount", () => {
    const fn = jest.fn(() => 3);
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge({ getStakesCount: fn }));
    expect(getVotesCount(mockAccount)).toBe(3);
    expect(getAccountBridge).toHaveBeenCalledWith(mockAccount);
  });

  it("returns 0 when bridge has no method", () => {
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge());
    expect(getVotesCount(mockAccount)).toBe(0);
  });

  it("returns 0 when getAccountBridge throws", () => {
    (getAccountBridge as jest.Mock).mockImplementation(() => { throw new Error("not supported"); });
    expect(getVotesCount(mockAccount)).toBe(0);
  });
});
