import { toCBOR } from "./serializer";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import BigNumber from "bignumber.js";
import { getSubAccount } from "../common-logic";
import { getAddress } from "../common-logic/index";

jest.mock("@ledgerhq/logs");

jest.mock("../common-logic", () => ({
  getSubAccount: jest.fn(),
}));

jest.mock("../common-logic/index", () => ({
  getAddress: jest.fn(),
  getSubAccount: jest.fn(),
}));

jest.mock("../erc20/tokenAccounts", () => ({
  encodeTxnParams: jest.fn(() => Buffer.from("mockencoded").toString("base64")),
}));

const mockedGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;
const mockedGetSubAccount = getSubAccount as jest.MockedFunction<typeof getSubAccount>;

// Valid addresses for testing
const VALID_F1_SENDER = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
const VALID_F1_RECIPIENT = "f17uoq6tp427uzv7fztkbsnn64iwotfrristwpryy";
const VALID_ETH_CONTRACT = "0x60E1773636CF5E4A227d9AC24F20fEca034ee25A";

describe("toCBOR", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAddress.mockReturnValue({
      address: VALID_F1_SENDER,
      derivationPath: "m/44'/461'/0'/0/0",
    });
    mockedGetSubAccount.mockReturnValue(null);
  });

  const mockAccount: Account = {
    id: "js:2:filecoin:f1sender:filecoin",
    type: "Account",
    freshAddress: VALID_F1_SENDER,
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
    recipient: VALID_F1_RECIPIENT,
    useAllAmount: false,
  };

  it("should serialize a native transfer transaction", async () => {
    const result = await toCBOR(mockAccount, mockTransaction);

    expect(result.txPayload).toBeDefined();
    expect(result.txPayload.length).toBeGreaterThan(0);
    expect(result.recipientToBroadcast).toBe(VALID_F1_RECIPIENT);
    expect(result.parsedSender).toBe(VALID_F1_SENDER);
    expect(result.amountToBroadcast).toEqual(new BigNumber("1000000000000000000"));
    expect(result.encodedParams).toBe("");
  });

  it("should throw when recipient address is invalid", async () => {
    const txWithInvalidRecipient: Transaction = {
      ...mockTransaction,
      recipient: "invalid-address",
    };

    await expect(toCBOR(mockAccount, txWithInvalidRecipient)).rejects.toThrow(
      "recipient and/or from address are not valid",
    );
  });

  it("should throw when sender address is invalid", async () => {
    mockedGetAddress.mockReturnValue({
      address: "invalid-sender",
      derivationPath: "m/44'/461'/0'/0/0",
    });

    await expect(toCBOR(mockAccount, mockTransaction)).rejects.toThrow(
      "recipient and/or from address are not valid",
    );
  });

  it("should serialize a token transfer transaction", async () => {
    const mockTokenAccount: TokenAccount = {
      id: "js:2:filecoin:f1sender:filecoin+erc20:contract",
      type: "TokenAccount",
      token: {
        id: "filecoin/erc20/contract",
        contractAddress: VALID_ETH_CONTRACT,
      },
    } as TokenAccount;

    mockedGetSubAccount.mockReturnValue(mockTokenAccount);

    const txWithParams: Transaction = {
      ...mockTransaction,
      params: "", // Empty params for this test
    };

    const result = await toCBOR(mockAccount, txWithParams);

    // Token transfers use contract address as recipient
    expect(result.recipientToBroadcast).toMatch(/^f410/);
    expect(result.amountToBroadcast).toEqual(new BigNumber("0")); // Token transfers have 0 native amount
  });

  it("should throw when token contract address is invalid", async () => {
    const mockTokenAccount: TokenAccount = {
      id: "js:2:filecoin:f1sender:filecoin+erc20:contract",
      type: "TokenAccount",
      token: {
        id: "filecoin/erc20/contract",
        contractAddress: "invalid-contract",
      },
    } as TokenAccount;

    mockedGetSubAccount.mockReturnValue(mockTokenAccount);

    // With invalid contract address, the validateAddress will fail for the contract
    await expect(toCBOR(mockAccount, mockTransaction)).rejects.toThrow();
  });

  it("should handle version 0 correctly", async () => {
    const txWithVersion0: Transaction = {
      ...mockTransaction,
      version: 0,
    };

    const result = await toCBOR(mockAccount, txWithVersion0);

    expect(result.txPayload).toBeDefined();
    expect(result.txPayload.length).toBeGreaterThan(0);
  });

  it("should handle non-zero version", async () => {
    const txWithVersion1: Transaction = {
      ...mockTransaction,
      version: 1,
    };

    const result = await toCBOR(mockAccount, txWithVersion1);

    expect(result.txPayload).toBeDefined();
  });
});
