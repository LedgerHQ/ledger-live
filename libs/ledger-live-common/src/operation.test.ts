jest.mock("./coin-modules/registry", () => ({
  loadIsEditableOperationForFamily: jest.fn(),
  loadIsStuckOperationForFamily: jest.fn(),
  loadGetStuckAccountAndOperationForFamily: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  getMainAccount: (a: any) => a,
}));

import {
  loadIsEditableOperationForFamily,
  loadIsStuckOperationForFamily,
  loadGetStuckAccountAndOperationForFamily,
} from "./coin-modules/registry";
import { isEditableOperation, isStuckOperation, getStuckAccountAndOperation } from "./operation";

const mockAccount = { currency: { family: "evm", id: "ethereum" } } as any;
const mockOperation = {} as any;

beforeEach(() => jest.clearAllMocks());

describe("isEditableOperation", () => {
  it("delegates to loader and returns result", () => {
    const fn = jest.fn(() => true);
    (loadIsEditableOperationForFamily as jest.Mock).mockReturnValue(fn);
    expect(isEditableOperation({ account: mockAccount, operation: mockOperation })).toBe(true);
    expect(loadIsEditableOperationForFamily).toHaveBeenCalledWith("evm");
    expect(fn).toHaveBeenCalled();
  });

  it("returns false when no loader", () => {
    (loadIsEditableOperationForFamily as jest.Mock).mockReturnValue(undefined);
    expect(isEditableOperation({ account: mockAccount, operation: mockOperation })).toBe(false);
  });
});

describe("isStuckOperation", () => {
  it("delegates to loader", () => {
    const fn = jest.fn(() => true);
    (loadIsStuckOperationForFamily as jest.Mock).mockReturnValue(fn);
    expect(isStuckOperation({ family: "evm", operation: mockOperation })).toBe(true);
    expect(loadIsStuckOperationForFamily).toHaveBeenCalledWith("evm");
  });

  it("returns false when no loader", () => {
    (loadIsStuckOperationForFamily as jest.Mock).mockReturnValue(undefined);
    expect(isStuckOperation({ family: "evm", operation: mockOperation })).toBe(false);
  });
});

describe("getStuckAccountAndOperation", () => {
  it("delegates to loader", () => {
    const result = { account: mockAccount, parentAccount: undefined, operation: mockOperation };
    const fn = jest.fn(() => result);
    (loadGetStuckAccountAndOperationForFamily as jest.Mock).mockReturnValue(fn);
    expect(getStuckAccountAndOperation(mockAccount, null)).toBe(result);
    expect(loadGetStuckAccountAndOperationForFamily).toHaveBeenCalledWith("evm");
  });

  it("returns undefined when no loader", () => {
    (loadGetStuckAccountAndOperationForFamily as jest.Mock).mockReturnValue(undefined);
    expect(getStuckAccountAndOperation(mockAccount, null)).toBeUndefined();
  });
});
