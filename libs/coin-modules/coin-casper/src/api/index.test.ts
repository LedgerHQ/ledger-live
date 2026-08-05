import { getMockedConfig } from "../__tests__/fixtures";
import { setCoinConfig } from "../config";
import { combine } from "../logic/combine";
import { createApi } from "./index";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

const mockConfig = jest.fn().mockReturnValue(getMockedConfig());

describe("createApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls setCoinConfig with the provided config", () => {
    createApi(mockConfig);
    expect(setCoinConfig).toHaveBeenCalledWith(mockConfig);
  });

  it("returns an object with all CoinModuleApi methods", () => {
    const api = createApi(mockConfig);
    const methods = [
      "lastBlock",
      "getBlockInfo",
      "getBlock",
      "call",
      "getValidators",
      "getBalance",
      "listOperations",
      "getStakes",
      "getRewards",
      "craftTransaction",
      "craftRawTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "validateIntent",
      "getNextSequence",
      "validateAddress",
      "craftTransactionData",
    ];
    for (const method of methods) {
      expect(typeof api[method as keyof typeof api]).toBe("function");
    }
  });

  it.each([
    ["lastBlock", []],
    ["getBalance", ["someAddress"]],
    ["broadcast", ["rawTx"]],
    ["validateAddress", ["addr", {}]],
  ])("%s throws 'not supported'", (_method, args) => {
    const api = createApi(mockConfig);
    const fn = api[_method as keyof typeof api] as (...a: unknown[]) => unknown;
    expect(() => fn(...args)).toThrow(`${_method} is not supported`);
  });

  it("wires combine to the shared logic implementation", () => {
    const api = createApi(mockConfig);
    expect(api.combine).toBe(combine);
  });
});
