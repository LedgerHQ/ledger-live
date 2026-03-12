import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ethers } from "ethers";
import { getNodeApi } from "../network/node";
import { getSequence } from "./getSequence";
import { validateTransaction } from "./validateTransaction";

jest.mock("../network/node", () => ({
  getNodeApi: jest.fn(),
}));

jest.mock("./getSequence", () => ({
  getSequence: jest.fn(),
}));

jest.mock("ethers", () => ({
  ethers: {
    Transaction: {
      from: jest.fn(),
    },
  },
}));

const mockGetNodeApi = getNodeApi as jest.Mock;
const mockGetSequence = getSequence as jest.Mock;
const mockTransactionFrom = ethers.Transaction.from as jest.Mock;

describe("validateTransaction", () => {
  const mockCurrency = { id: "ethereum" } as CryptoCurrency;
  const signature = "0xsignedtx";
  const getTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockReturnValue({ getTransaction });
  });

  it("returns an error when transaction is already mined", async () => {
    mockTransactionFrom.mockReturnValue({
      hash: "0xhash",
      from: "0xfrom",
      nonce: 1,
    });
    getTransaction.mockResolvedValue({
      hash: "0xhash",
      blockHeight: 123,
    });

    const result = await validateTransaction(mockCurrency, { signature });

    expect(result.error?.name).toBe("InvalidTransactionError");
  });

  it("returns an error when transaction is already known", async () => {
    mockTransactionFrom.mockReturnValue({
      hash: "0xhash",
      from: "0xfrom",
      nonce: 3,
    });
    getTransaction.mockResolvedValue({
      hash: "0xhash",
      blockHeight: null,
    });

    const result = await validateTransaction(mockCurrency, { signature });

    expect(result.error?.name).toBe("InvalidTransactionError");
  });

  it("returns an error when nonce is too low", async () => {
    mockTransactionFrom.mockReturnValue({
      hash: "0xhash",
      from: "0xfrom",
      nonce: 2,
    });
    getTransaction.mockRejectedValue(new Error("not found"));
    mockGetSequence.mockResolvedValue(5n);

    const result = await validateTransaction(mockCurrency, { signature });

    expect(result.error?.name).toBe("InvalidTransactionError");
    expect(mockGetSequence).toHaveBeenCalledWith(mockCurrency, "0xfrom");
  });

  it("returns no error when transaction can be broadcasted", async () => {
    mockTransactionFrom.mockReturnValue({
      hash: "0xhash",
      from: "0xfrom",
      nonce: 7,
    });
    getTransaction.mockRejectedValue(new Error("not found"));
    mockGetSequence.mockResolvedValue(7n);

    const result = await validateTransaction(mockCurrency, { signature });

    expect(result).toEqual({ error: undefined });
  });
});
