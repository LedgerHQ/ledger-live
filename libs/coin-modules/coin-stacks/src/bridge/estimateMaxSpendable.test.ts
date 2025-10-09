import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { Account } from "@ledgerhq/types-live";
import { estimateTransaction, estimateTransactionByteLength } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { createTransaction } from "./createTransaction";
import { getAccountInfo } from "./utils/account";
import { getAddress } from "./utils/misc";
import { createTransaction as createStacksTransaction } from "./utils/transactions";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

jest.mock("@ledgerhq/cryptoassets/abandonseed");
jest.mock("@stacks/transactions");
jest.mock("./createTransaction");
jest.mock("./utils/account");
jest.mock("./utils/misc");
jest.mock("./utils/transactions");

describe("estimateMaxSpendable", () => {
  let getAbandonSeedAddressSpy: jest.SpyInstance;
  let getAccountInfoSpy: jest.SpyInstance;
  let getAddressSpy: jest.SpyInstance;
  let createTransactionSpy: jest.SpyInstance;
  let createStacksTransactionSpy: jest.SpyInstance;
  let estimateTransactionSpy: jest.SpyInstance;

  const mockMainAccount = {
    id: "mock-account-id",
    name: "Mock Account",
    address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    spendableBalance: new BigNumber(100000),
    currency: {
      id: "stacks",
    },
    xpub: "xpub123",
  } as unknown as Account;

  const mockSubAccount = {
    id: "mock-subaccount-id",
    name: "Mock Token Account",
    token: {
      id: "mock-token-id",
    },
    spendableBalance: new BigNumber(5000),
  };

  const mockTransaction = {
    family: "stacks",
    amount: new BigNumber(500),
    recipient: "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    network: "mainnet",
  } as unknown as Transaction;

  const mockCreatedTransaction = {
    family: "stacks",
    amount: new BigNumber(0),
    recipient: "",
    network: "mainnet",
  } as unknown as Transaction;

  const mockStacksTx = {
    payload: {},
    auth: {
      spendingCondition: {
        signer: "0x1234",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    getAbandonSeedAddressSpy = jest.spyOn({ getAbandonSeedAddress }, "getAbandonSeedAddress");
    getAccountInfoSpy = jest.spyOn({ getAccountInfo }, "getAccountInfo");
    getAddressSpy = jest.spyOn({ getAddress }, "getAddress");
    createTransactionSpy = jest.spyOn({ createTransaction }, "createTransaction");
    createStacksTransactionSpy = jest.spyOn({ createStacksTransaction }, "createStacksTransaction");
    estimateTransactionSpy = jest.spyOn({ estimateTransaction }, "estimateTransaction");

    getAbandonSeedAddressSpy.mockReturnValue("ST3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    getAccountInfoSpy.mockReturnValue({
      mainAccount: mockMainAccount,
      subAccount: null,
      tokenAccountTxn: false,
    });
    getAddressSpy.mockReturnValue({ address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" });
    createTransactionSpy.mockReturnValue(mockCreatedTransaction);
    createStacksTransactionSpy.mockResolvedValue(mockStacksTx);
    estimateTransactionSpy.mockResolvedValue([{ fee: 1000 }]);
    (estimateTransactionByteLength as jest.Mock).mockReturnValue(200);
  });

  it("should return token spendable balance for token transactions", async () => {
    getAccountInfoSpy.mockReturnValue({
      mainAccount: mockMainAccount,
      subAccount: mockSubAccount,
      tokenAccountTxn: true,
    });

    const result = await estimateMaxSpendable({
      account: mockMainAccount,
      transaction: mockTransaction,
    });

    expect(result).toEqual(new BigNumber(5000));
  });

  it("should create a dummy transaction with abandon seed address", async () => {
    await estimateMaxSpendable({
      account: mockMainAccount,
      transaction: mockTransaction,
    });

    expect(getAbandonSeedAddressSpy).toHaveBeenCalledWith("stacks");
    expect(createTransactionSpy).toHaveBeenCalledWith(mockMainAccount);

    expect(createStacksTransactionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "ST3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        useAllAmount: true,
      }),
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      "xpub123",
      undefined,
      undefined,
      undefined,
    );
  });

  it("should estimate transaction fee", async () => {
    await estimateMaxSpendable({
      account: mockMainAccount,
      transaction: mockTransaction,
    });

    expect(estimateTransactionSpy).toHaveBeenCalledWith(
      mockStacksTx.payload,
      200,
      expect.any(Object),
    );
  });

  it("should calculate max spendable by subtracting fee from balance", async () => {
    const result = await estimateMaxSpendable({
      account: mockMainAccount,
      transaction: mockTransaction,
    });

    expect(result).toEqual(new BigNumber(99000)); // 100000 - 1000
  });

  it("should return 0 if fee exceeds balance", async () => {
    mockMainAccount.spendableBalance = new BigNumber(500);
    estimateTransactionSpy.mockResolvedValue([{ fee: 1000 }]);

    const result = await estimateMaxSpendable({
      account: mockMainAccount,
      transaction: mockTransaction,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  it("should throw error when xpub is missing", async () => {
    const accountWithoutXpub = {
      ...mockMainAccount,
      xpub: undefined,
    } as unknown as Account;

    getAccountInfoSpy.mockReturnValue({
      mainAccount: accountWithoutXpub,
      subAccount: null,
      tokenAccountTxn: false,
    });

    await expect(
      estimateMaxSpendable({
        account: accountWithoutXpub,
        transaction: mockTransaction,
      }),
    ).rejects.toThrow("xpub is required");
  });

  it("should use provided network configuration", async () => {
    const txWithTestnet = {
      ...mockTransaction,
      network: "testnet",
    } as unknown as Transaction;

    await estimateMaxSpendable({
      account: mockMainAccount,
      transaction: txWithTestnet,
    });

    // This test is a bit tricky since we're mocking the internals
    // We can verify that createStacksTransaction was called with the right network
    expect(createStacksTransactionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        network: "testnet",
      }),
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      "xpub123",
      undefined,
      undefined,
      undefined,
    );
  });
});
