import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { rpcTransactionToBlockOperations } from "../adapters/blockOperations";
import { getNodeApi } from "../network/node";
import { getPendingTransactions } from "./getPendingTransactions";

jest.mock("../network/node", () => ({
  getNodeApi: jest.fn(),
}));

jest.mock("../adapters/blockOperations", () => ({
  rpcTransactionToBlockOperations: jest.fn(),
}));

describe("getPendingTransactions", () => {
  const currency = { id: "ethereum" } as CryptoCurrency;
  const address = "0x1234567890abcdef1234567890abcdef12345678";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps node pending transactions to block transactions", async () => {
    const firstTx = {
      hash: "0xaaa",
      status: 0,
      gasUsed: "0x5208",
      gasPrice: "0x3b9aca00",
      from: "0x1111111111111111111111111111111111111111",
      nonce: 7,
    };
    const secondTx = {
      hash: "0xbbb",
      status: null,
      gasUsed: "21000",
      gasPrice: "2000000000",
      from: "0x2222222222222222222222222222222222222222",
      nonce: 8,
    };

    const mockGetPendingTransactions = jest.fn().mockResolvedValue([firstTx, secondTx]);
    jest.mocked(getNodeApi).mockReturnValue({
      getPendingTransactions: mockGetPendingTransactions,
    } as any);

    jest
      .mocked(rpcTransactionToBlockOperations)
      .mockReturnValueOnce([
        { type: "transfer", address: firstTx.from, amount: 1n, asset: { type: "native" } },
      ] as any)
      .mockReturnValueOnce([
        { type: "transfer", address: secondTx.from, amount: 2n, asset: { type: "native" } },
      ] as any);

    const result = await getPendingTransactions(currency, address);

    expect(result).toEqual({
      items: [
        {
          hash: firstTx.hash,
          failed: true,
          operations: [
            { type: "transfer", address: firstTx.from, amount: 1n, asset: { type: "native" } },
          ],
          fees: 21000n * 1000000000n,
          feesPayer: firstTx.from,
          details: {
            sequence: firstTx.nonce,
            nonce: firstTx.nonce,
            type: undefined,
            gasLimit: firstTx.gasUsed,
            gasPrice: firstTx.gasPrice,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            recipient: undefined,
            value: undefined,
            data: undefined,
          },
        },
        {
          hash: secondTx.hash,
          failed: false,
          operations: [
            { type: "transfer", address: secondTx.from, amount: 2n, asset: { type: "native" } },
          ],
          fees: 21000n * 2000000000n,
          feesPayer: secondTx.from,
          details: {
            sequence: secondTx.nonce,
            nonce: secondTx.nonce,
            type: undefined,
            gasLimit: secondTx.gasUsed,
            gasPrice: secondTx.gasPrice,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            recipient: undefined,
            value: undefined,
            data: undefined,
          },
        },
      ],
    });
    expect(mockGetPendingTransactions).toHaveBeenCalledWith(currency, address);
    expect(rpcTransactionToBlockOperations).toHaveBeenNthCalledWith(1, firstTx);
    expect(rpcTransactionToBlockOperations).toHaveBeenNthCalledWith(2, secondTx);
  });

  it("returns an empty page when there are no pending transactions", async () => {
    jest.mocked(getNodeApi).mockReturnValue({
      getPendingTransactions: jest.fn().mockResolvedValue([]),
    } as any);
    jest.mocked(rpcTransactionToBlockOperations).mockReturnValue([] as any);

    const result = await getPendingTransactions(currency, address);

    expect(result).toEqual({ items: [] });
    expect(rpcTransactionToBlockOperations).not.toHaveBeenCalled();
  });
});
