import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { toCBOR } from "./serializer";
import { Transaction } from "../types";

jest.mock("@ledgerhq/logs");

// iso-filecoin's Message runs address-checksum validation inside serialize(); stub it
// and capture the constructor args so we can assert exactly what `value` we serialize.
const mockMessageCtor = jest.fn();
jest.mock("iso-filecoin/message", () => ({
  Message: class {
    constructor(msg: Record<string, unknown>) {
      mockMessageCtor(msg);
    }
    serialize(): Uint8Array {
      return new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    }
  },
}));

// Stub the iso-filecoin-backed validator so synthetic test addresses pass.
jest.mock("../network", () => ({
  validateAddress: (input: string) => ({
    isValid: input !== "INVALID",
    parsedAddress: { toString: () => input },
  }),
}));

jest.mock("../erc20/tokenAccounts", () => ({
  encodeTxnParams: (_data: string) => "encoded-params",
}));

const ATTO_PER_FIL = new BigNumber(10).pow(18);

function makeAccount(): Account {
  return {
    id: "js:2:filecoin:f1sender:glif",
    freshAddress: "f1sender",
    freshAddressPath: "44'/461'/0'/0/0",
    subAccounts: [],
  } as unknown as Account;
}

function makeTx(fil: number): Transaction {
  return {
    family: "filecoin",
    recipient: "f1recipient",
    amount: new BigNumber(fil).times(ATTO_PER_FIL),
    method: 0,
    version: 0,
    nonce: 6,
    gasLimit: new BigNumber(1516578),
    gasFeeCap: new BigNumber(854792),
    gasPremium: new BigNumber(199489),
  } as unknown as Transaction;
}

describe("toCBOR (legacy bridge serializer)", () => {
  beforeEach(() => mockMessageCtor.mockClear());

  // Regression test for LIVE-31661: value must be serialized as a plain integer string (no exponential notation).
  it.each([
    [999, "999000000000000000000"],
    [1000, "1000000000000000000000"],
    [1001, "1001000000000000000000"],
    [12345, "12345000000000000000000"],
  ])("serializes %i FIL as a plain integer string, never exponential", async (fil, expected) => {
    const res = await toCBOR(makeAccount(), makeTx(fil));

    // value handed to the CBOR Message (what the device signs)
    const messageArg = mockMessageCtor.mock.calls[0][0] as { value: string };
    expect(messageArg.value).toBe(expected);
    expect(messageArg.value).not.toMatch(/e/i);

    // value carried forward for broadcast
    expect(res.amountToBroadcast.toFixed()).toBe(expected);
    expect(res.amountToBroadcast.toFixed()).not.toMatch(/e/i);
  });

  it("serializes a token transfer amount as 0", async () => {
    const account = makeAccount();
    const subAccountId = "js:2:filecoin:f1sender:glif+erc20";
    (account as unknown as { subAccounts: unknown[] }).subAccounts = [
      {
        id: subAccountId,
        type: "TokenAccount",
        token: { contractAddress: "f1contract" },
      },
    ];
    const tx = { ...makeTx(1000), subAccountId, params: "0xdata" } as unknown as Transaction;

    const res = await toCBOR(account, tx);

    expect((mockMessageCtor.mock.calls[0][0] as { value: string }).value).toBe("0");
    expect(res.amountToBroadcast.toFixed()).toBe("0");
  });
});
