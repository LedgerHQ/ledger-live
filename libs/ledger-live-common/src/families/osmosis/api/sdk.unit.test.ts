import BigNumber from "bignumber.js";
import { getOperationValue, convertTransactionToOperation } from "./sdk";
import type {
  OsmosisSendEventContent,
  OsmosisAmount,
  OsmosisAccountTransaction,
  OsmosisEvent,
} from "./sdk.types";
import { OsmosisTransactionTypeEnum } from "./sdk.types";
jest.mock("../../../network");

const mockOsmosisAmount: OsmosisAmount = {
  text: "",
  currency: "",
  numeric: "300",
};
const mockOsmosisSendEventContent: OsmosisSendEventContent = {
  type: ["", ""],
  module: "",
  sender: [{ account: {}, amounts: [mockOsmosisAmount] }],
  recipient: [{ account: {}, amounts: [mockOsmosisAmount] }],
  transfers: [],
};

const mockOsmosisEvent: OsmosisEvent = {
  id: "",
  kind: OsmosisTransactionTypeEnum,
  sub: [mockOsmosisSendEventContent],
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

test("getOperationValue", () => {
  expect(
    getOperationValue(
      mockOsmosisSendEventContent,
      "UNKNOWN",
      new BigNumber(100)
    ).toString()
  ).toBe("0");
});

test("convertTransactionToOperation", () => {
  const result = convertTransactionToOperation(
    "test",
    "OUT",
    new BigNumber(123),
    mockOsmosisAccountTransaction,
    ["test_sender"],
    ["test_recipient"],
    {}
  );

  expect(result.senders.length).toBe(1);
  expect(result.recipients.length).toBe(1);
});
