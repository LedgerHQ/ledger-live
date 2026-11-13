import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import BigNumber from "bignumber.js";
import { getDelegation } from "../../api/node";

const mockExecute = jest.fn();

jest.mock("icon-sdk-js", () => {
  const actual = jest.requireActual("icon-sdk-js");
  const IconService = function () {
    return { call: () => ({ execute: mockExecute }) };
  };
  Object.assign(IconService, actual.default ?? actual, { HttpProvider: jest.fn() });
  return { __esModule: true, default: IconService };
});

jest.mock("../../config", () => ({
  getCoinConfig: () => ({ infra: { node_endpoint: "http://node" } }),
}));

const ADDRESS = "hx0000000000000000000000000000000000000001";

describe("getDelegation", () => {
  const currency = getCryptoCurrencyById("icon");

  it("parses hex totalDelegated and votingPower", async () => {
    mockExecute.mockResolvedValue({ delegations: [], totalDelegated: "0x10", votingPower: "0xa" });

    const result = await getDelegation(ADDRESS, currency);

    expect(result.totalDelegated).toEqual(new BigNumber(16));
    expect(result.votingPower).toEqual(new BigNumber(10));
  });

  it("defaults missing or invalid amounts to 0", async () => {
    mockExecute.mockResolvedValue({ delegations: [], votingPower: "invalid" });

    const result = await getDelegation(ADDRESS, currency);

    expect(result.totalDelegated).toEqual(new BigNumber(0));
    expect(result.votingPower).toEqual(new BigNumber(0));
  });
});
