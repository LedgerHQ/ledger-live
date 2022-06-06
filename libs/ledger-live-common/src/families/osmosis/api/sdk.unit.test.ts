import BigNumber from "bignumber.js";
import network from "../../../network";
import {
  fetchAccountInfo,
  getOperationValue,
  getMicroOsmoAmountCosmosType,
  convertTransactionToOperation,
  getChainId,
} from "./sdk";
import type {
  OsmosisEventContent,
  OsmosisAmount,
  CosmosAmount,
  OsmosisAccountTransaction,
  OsmosisEvent,
} from "./sdk.types";
import { OsmosisAccountTransactionTypeEnum } from "./sdk.types";
jest.mock("../../../network");

const mockNetwork = network as jest.MockedFunction<typeof network>;

const mockOsmosisAmount: OsmosisAmount = {
  text: "",
  currency: "",
  numeric: "300",
};
const mockOsmosisEventContent: OsmosisEventContent = {
  type: ["", ""],
  module: "",
  sender: [{ account: {}, amounts: [mockOsmosisAmount] }],
  recipient: [{ account: {}, amounts: [mockOsmosisAmount] }],
  transfers: [],
};

const mockOsmosisEvent: OsmosisEvent = {
  id: "",
  kind: OsmosisAccountTransactionTypeEnum,
  sub: [mockOsmosisEventContent],
};

const mockOsmosisAccountTransaction: OsmosisAccountTransaction = {
  id: "",
  hash: "",
  block_hash: "",
  height: 0,
  chain_id: "",
  time: new Date(),
  transaction_fee: [mockOsmosisAmount],
  gas_wanted: 0,
  gas_used: 0,
  version: "",
  events: [mockOsmosisEvent],
  has_errors: false,
  memo: "",
};

describe("osmosis sdk", () => {
  mockNetwork.mockResolvedValue({ data: null });
  test("fetchAccountInfo", async () => {
    await expect(
      async () => await fetchAccountInfo("mockaddress")
    ).rejects.toThrow(/fetching/);
  });

  test("fetchLatestBlockInfo", async () => {
    await expect(async () => await getChainId()).rejects.toThrow(/fetching/);
  });

  test("getOperationValue", () => {
    expect(
      getOperationValue(
        mockOsmosisEventContent,
        "UNKNOWN",
        new BigNumber(100)
      ).toString()
    ).toBe("0");
  });

  test("getMicroOsmoAmountCosmosType", () => {
    const mockCosmosAmount: CosmosAmount = { amount: "300", denom: "Cosmos" };

    expect(getMicroOsmoAmountCosmosType([mockCosmosAmount]).toString()).toBe(
      "0"
    );
  });

  test("convertTransactionToOperation", () => {
    const result = convertTransactionToOperation(
      "test",
      "test",
      mockOsmosisEventContent,
      mockOsmosisAccountTransaction,
      ""
    );

    expect(result.senders.length).toBe(0);
    expect(result.recipients.length).toBe(0);
  });
});
