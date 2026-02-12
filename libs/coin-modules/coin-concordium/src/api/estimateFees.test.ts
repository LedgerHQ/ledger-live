import type { ConcordiumCoinConfig } from "../types";
import { VALID_ADDRESS, VALID_ADDRESS_2 } from "../test/fixtures";
import { createApi } from ".";

jest.mock("../logic", () => ({
  craftTransaction: jest.fn(),
  estimateFees: jest.fn(),
}));

jest.mock("@ledgerhq/hw-app-concordium/lib/cbor", () => ({
  encodeMemoToCbor: jest.fn((memo: string) => Buffer.from([0x68, ...Buffer.from(memo, "utf-8")])),
}));

const { craftTransaction: craftTransactionMock, estimateFees: estimateFeesMock } =
  jest.requireMock("../logic");

const mockConfig: ConcordiumCoinConfig = {
  networkType: "testnet",
  grpcUrl: "https://grpc.testnet.concordium.com",
  grpcPort: 20000,
  proxyUrl: "https://wallet-proxy.testnet.concordium.com",
  minReserve: 0,
};

describe("api/estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should estimate fees for transaction with memo", async () => {
    const api = createApi(mockConfig);
    craftTransactionMock.mockResolvedValue({
      type: 22, // TransferWithMemo
      header: {
        sender: { address: VALID_ADDRESS, toBuffer: () => Buffer.alloc(32) },
        nonce: BigInt(0),
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        energyAmount: BigInt(0),
      },
      payload: {
        toAddress: { address: VALID_ADDRESS_2, toBuffer: () => Buffer.alloc(32) },
        amount: BigInt(1000000),
        memo: Buffer.from("fee test"),
      },
    });
    estimateFeesMock.mockResolvedValue({ cost: BigInt(1500) });
    const transactionIntent = {
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: BigInt(1000000),
      memo: { type: "string" as const, value: "fee test" },
    };

    const result = await api.estimateFees(transactionIntent);

    expect(estimateFeesMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "concordium" }),
      22, // TransactionType.TransferWithMemo
      9, // memoSize: "fee test" = 9 bytes CBOR-encoded (1 byte header + 8 bytes string)
    );
    expect(result).toEqual({ value: BigInt(1500) });
  });

  it("should estimate fees for transaction without memo", async () => {
    const api = createApi(mockConfig);
    craftTransactionMock.mockResolvedValue({
      type: 3, // Transfer
      header: {
        sender: { address: VALID_ADDRESS, toBuffer: () => Buffer.alloc(32) },
        nonce: BigInt(0),
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        energyAmount: BigInt(0),
      },
      payload: {
        toAddress: { address: VALID_ADDRESS_2, toBuffer: () => Buffer.alloc(32) },
        amount: BigInt(500000),
      },
    });
    estimateFeesMock.mockResolvedValue({ cost: BigInt(1000) });
    const transactionIntent = {
      sender: VALID_ADDRESS,
      recipient: VALID_ADDRESS_2,
      amount: BigInt(500000),
    };

    const result = await api.estimateFees(transactionIntent);

    expect(result).toEqual({ value: BigInt(1000) });
  });
});
