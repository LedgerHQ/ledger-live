jest.mock("@ledgerhq/coin-framework/bridge/getAddressWrapper", () => jest.fn());
jest.mock("@ledgerhq/coin-framework/signer", () => jest.fn());
jest.mock("@ledgerhq/types-live", () => jest.fn());
jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  makeAccountBridgeReceive: jest.fn(),
  makeScanAccounts: jest.fn(),
  getSerializedAddressParameters: jest.fn(),
  makeSync: jest.fn(),
}));
jest.mock("../signer", () => jest.fn());
jest.mock("../types", () => jest.fn());
jest.mock("../bridge/getTransactionStatus", () => jest.fn());
jest.mock("../bridge/estimateMaxSpendable", () => jest.fn());
jest.mock("../bridge/prepareTransaction", () => jest.fn());
jest.mock("../bridge/createTransaction", () => jest.fn());
jest.mock("../bridge/synchronisation", () => jest.fn());
jest.mock("../bridge/signOperation", () => jest.fn());
jest.mock("../bridge/broadcast", () => jest.fn());

import { createBridges } from "../bridge";

describe("APTOS index", () => {
  it("should export a function createBridges", () => {
    expect(typeof createBridges).toBe("function");
  });
});
