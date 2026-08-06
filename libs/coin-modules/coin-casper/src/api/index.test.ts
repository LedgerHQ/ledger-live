import { setCoinConfig } from "../config";
import { casperMainnetConfig } from "../__tests__/fixtures/config.fixture";
import { createApi } from "./index";

jest.mock("../config", () => ({
  setCoinConfig: jest.fn(),
}));

const mockConfig = jest.fn().mockReturnValue(casperMainnetConfig());

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
});
