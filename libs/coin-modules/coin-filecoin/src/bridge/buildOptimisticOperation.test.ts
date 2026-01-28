import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { toCBORResponse } from "./serializer";
import BigNumber from "bignumber.js";
import { getSubAccount } from "../common-logic/utils";
import { convertAddressEthToFil } from "../network";

jest.mock("../common-logic/utils");
jest.mock("../network");

const mockedGetSubAccount = getSubAccount as jest.MockedFunction<typeof getSubAccount>;
const mockedConvertAddressEthToFil = convertAddressEthToFil as jest.MockedFunction<
  typeof convertAddressEthToFil
>;

describe("buildOptimisticOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSubAccount.mockReturnValue(null);
    mockedConvertAddressEthToFil.mockImplementation(addr => addr);
  });

  const mockAccount: Account = {
    id: "js:2:filecoin:f1sender:filecoin",
    freshAddress: "f1sender",
    currency: { id: "filecoin", name: "Filecoin", ticker: "FIL" },
  } as Account;

  const mockTransaction: Transaction = {
    family: "filecoin",
    amount: new BigNumber("1000000000000000000"),
    method: 0,
    version: 0,
    nonce: 1,
    gasLimit: new BigNumber("1000000"),
    gasFeeCap: new BigNumber("100000"),
    gasPremium: new BigNumber("50000"),
    recipient: "f1recipient",
    useAllAmount: false,
  };

  const mockSerializationRes: toCBORResponse = {
    txPayload: Buffer.from([]),
    recipientToBroadcast: "f1recipient",
    parsedSender: "f1sender",
    encodedParams: "",
    amountToBroadcast: new BigNumber("1000000000000000000"),
  };

  it("should build optimistic operation for native transfer", async () => {
    const result = await buildOptimisticOperation(
      mockAccount,
      mockTransaction,
      mockSerializationRes,
    );

    expect(result.type).toBe("OUT");
    expect(result.hash).toBe("");
    expect(result.senders).toEqual(["f1sender"]);
    expect(result.recipients).toEqual(["f1recipient"]);
    expect(result.accountId).toBe(mockAccount.id);
    expect(result.fee.toString()).toBe("100000000000");
    expect(result.blockHeight).toBeNull();
    expect(result.blockHash).toBeNull();
  });

  it("should build optimistic operation for token transfer", async () => {
    const mockTokenAccount: TokenAccount = {
      id: "js:2:filecoin:f1sender:filecoin+erc20:contract",
      type: "TokenAccount",
      token: {
        id: "filecoin/erc20/contract",
        contractAddress: "0x1234567890123456789012345678901234567890",
      },
    } as TokenAccount;

    mockedGetSubAccount.mockReturnValue(mockTokenAccount);
    mockedConvertAddressEthToFil.mockReturnValue("f410fconverted");

    const result = await buildOptimisticOperation(
      mockAccount,
      mockTransaction,
      mockSerializationRes,
    );

    expect(result.type).toBe("OUT");
    expect(result.accountId).toBe(mockTokenAccount.id);
    expect(result.recipients).toEqual(["f410fconverted"]);
    expect(result.value).toEqual(mockSerializationRes.amountToBroadcast);
  });

  it("should calculate correct fee from gasFeeCap and gasLimit", async () => {
    const txWithHighGas: Transaction = {
      ...mockTransaction,
      gasFeeCap: new BigNumber("200000"),
      gasLimit: new BigNumber("2000000"),
    };

    const result = await buildOptimisticOperation(mockAccount, txWithHighGas, mockSerializationRes);

    // fee = gasFeeCap * gasLimit = 200000 * 2000000 = 400000000000
    expect(result.fee.toString()).toBe("400000000000");
  });

  it("should use custom operation type when provided", async () => {
    const result = await buildOptimisticOperation(
      mockAccount,
      mockTransaction,
      mockSerializationRes,
      "FEES",
    );

    expect(result.type).toBe("FEES");
  });

  it("should set date to current time", async () => {
    const before = new Date();
    const result = await buildOptimisticOperation(
      mockAccount,
      mockTransaction,
      mockSerializationRes,
    );
    const after = new Date();

    expect(result.date.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.date.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
