jest.mock("./bridge", () => ({
  getAccountBridge: jest.fn(),
  getAccountBridgeByFamily: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  getMainAccount: (a: any) => a,
}));

import { getAccountBridge, getAccountBridgeByFamily } from "./bridge";
import { isEditableOperation, isStuckOperation, getStuckAccountAndOperation } from "./operation";

const mockAccount = { currency: { family: "evm", id: "ethereum" } } as any;
const mockOperation = {} as any;

const makeMockBridge = (overrides = {}) => ({
  isEditableOperation: undefined,
  isStuckOperation: undefined,
  getStuckAccountAndOperation: undefined,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("isEditableOperation", () => {
  it("delegates to bridge method and returns result", () => {
    const fn = jest.fn(() => true);
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge({ isEditableOperation: fn }));
    expect(isEditableOperation({ account: mockAccount, operation: mockOperation })).toBe(true);
    expect(getAccountBridge).toHaveBeenCalledWith(mockAccount);
    expect(fn).toHaveBeenCalledWith(mockAccount, mockOperation);
  });

  it("returns false when bridge has no method", () => {
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge());
    expect(isEditableOperation({ account: mockAccount, operation: mockOperation })).toBe(false);
  });
});

describe("isStuckOperation", () => {
  it("delegates to bridge method", () => {
    const fn = jest.fn(() => true);
    (getAccountBridgeByFamily as jest.Mock).mockReturnValue(makeMockBridge({ isStuckOperation: fn }));
    expect(isStuckOperation({ family: "evm", operation: mockOperation })).toBe(true);
    expect(getAccountBridgeByFamily).toHaveBeenCalledWith("evm");
    expect(fn).toHaveBeenCalledWith(mockOperation);
  });

  it("returns false when bridge has no method", () => {
    (getAccountBridgeByFamily as jest.Mock).mockReturnValue(makeMockBridge());
    expect(isStuckOperation({ family: "evm", operation: mockOperation })).toBe(false);
  });

  it("returns false when getAccountBridgeByFamily throws", () => {
    (getAccountBridgeByFamily as jest.Mock).mockImplementation(() => { throw new Error("no family"); });
    expect(isStuckOperation({ family: "unknown", operation: mockOperation })).toBe(false);
  });
});

describe("getStuckAccountAndOperation", () => {
  it("delegates to bridge method", () => {
    const result = { account: mockAccount, parentAccount: undefined, operation: mockOperation };
    const fn = jest.fn(() => result);
    (getAccountBridge as jest.Mock).mockReturnValue(
      makeMockBridge({ getStuckAccountAndOperation: fn }),
    );
    expect(getStuckAccountAndOperation(mockAccount, null)).toBe(result);
    expect(getAccountBridge).toHaveBeenCalledWith(mockAccount);
    expect(fn).toHaveBeenCalledWith(mockAccount, null);
  });

  it("returns undefined when bridge has no method", () => {
    (getAccountBridge as jest.Mock).mockReturnValue(makeMockBridge());
    expect(getStuckAccountAndOperation(mockAccount, null)).toBeUndefined();
  });
});
