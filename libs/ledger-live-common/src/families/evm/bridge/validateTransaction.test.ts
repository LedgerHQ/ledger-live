import { Transaction } from "ethers";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import { validateTransaction } from "./api";

jest.mock("ethers", () => ({
  Transaction: {
    from: jest.fn(),
  },
}));

const mockTransactionFrom = Transaction.from as jest.Mock;

describe("validateTransaction", () => {
  const signature = "0xsignedtx";
  const getTransactionInfo = jest.fn();
  const getNextSequence = jest.fn();
  const chain = {
    getAccountInfo: jest.fn(),
    call: jest.fn(),
    getNextSequence,
    getAddressesForPublicKey: jest.fn(),
    getTransactionInfo,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an error when transaction is already mined", async () => {
    mockTransactionFrom.mockReturnValue({ hash: "0xhash", from: "0xfrom", nonce: 1 });
    getTransactionInfo.mockResolvedValue({
      hash: "0xhash",
      block: { height: 123, hash: "0xblock", time: new Date() },
    });

    const result = await validateTransaction(signature, chain);

    expect(result.error?.name).toBe("InvalidTransactionError");
    expect(result.error?.message).toBe("transaction is already mined");
    expect(getTransactionInfo).toHaveBeenCalledWith("0xhash");
  });

  it("returns an error when transaction is already known", async () => {
    mockTransactionFrom.mockReturnValue({ hash: "0xhash", from: "0xfrom", nonce: 3 });
    getTransactionInfo.mockResolvedValue({ hash: "0xhash", block: null });

    const result = await validateTransaction(signature, chain);

    expect(result.error?.name).toBe("InvalidTransactionError");
    expect(result.error?.message).toBe("transaction is already known");
  });

  it("returns an error when nonce is too low", async () => {
    mockTransactionFrom.mockReturnValue({ hash: "0xhash", from: "0xfrom", nonce: 2 });
    getTransactionInfo.mockRejectedValue(new Error("not found"));
    getNextSequence.mockResolvedValue(5n);

    const result = await validateTransaction(signature, chain);

    expect(result.error?.name).toBe("InvalidTransactionError");
    expect(result.error?.message).toBe("nonce is too low");
    expect(getNextSequence).toHaveBeenCalledWith("0xfrom");
  });

  it("returns no error when transaction can be broadcasted", async () => {
    mockTransactionFrom.mockReturnValue({ hash: "0xhash", from: "0xfrom", nonce: 7 });
    getTransactionInfo.mockResolvedValue(undefined);
    getNextSequence.mockResolvedValue(7n);

    const result = await validateTransaction(signature, chain);

    expect(result).toEqual({ error: undefined });
  });

  it("checks no nonce the path cannot tell, nor a transaction without hash, sender or nonce", async () => {
    mockTransactionFrom.mockReturnValue({ hash: "0xhash", from: "0xfrom", nonce: 0 });
    getTransactionInfo.mockResolvedValue(undefined);
    getNextSequence.mockRejectedValue(new ChainReadUnsupportedError("unsupported"));
    await expect(validateTransaction(signature, chain)).resolves.toEqual({ error: undefined });

    mockTransactionFrom.mockReturnValue({ from: "0xfrom", nonce: null });
    getNextSequence.mockResolvedValue(9n);
    await expect(validateTransaction(signature, chain)).resolves.toEqual({ error: undefined });

    mockTransactionFrom.mockReturnValue({});
    await expect(validateTransaction(signature, chain)).resolves.toEqual({ error: undefined });
    expect(getTransactionInfo).toHaveBeenCalledTimes(1);
  });

  it("fails when the next sequence cannot be read", async () => {
    mockTransactionFrom.mockReturnValue({ from: "0xfrom", nonce: 1 });
    const down = new Error("node down");
    getNextSequence.mockRejectedValue(down);

    await expect(validateTransaction(signature, chain)).rejects.toBe(down);
  });
});
