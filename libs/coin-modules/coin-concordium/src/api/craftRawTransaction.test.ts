import type { ConcordiumCoinConfig } from "../types";
import { VALID_ADDRESS } from "../test/fixtures";
import { createApi } from ".";

jest.mock("../logic", () => ({
  craftRawTransaction: jest.fn(),
}));

const { craftRawTransaction: craftRawTransactionMock } = jest.requireMock("../logic");

const mockConfig: ConcordiumCoinConfig = {
  networkType: "testnet",
  grpcUrl: "https://grpc.testnet.concordium.com",
  grpcPort: 20000,
  proxyUrl: "https://wallet-proxy.testnet.concordium.com",
  minReserve: 0,
};

describe("api/craftRawTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should craft raw transaction", async () => {
    const api = createApi(mockConfig);
    craftRawTransactionMock.mockResolvedValue({
      serializedTransaction: "raw-serialized-tx",
    });

    const result = await api.craftRawTransaction(
      "raw-tx-data",
      VALID_ADDRESS,
      "public-key-hex",
      BigInt(42),
    );

    expect(craftRawTransactionMock).toHaveBeenCalledWith(
      "raw-tx-data",
      VALID_ADDRESS,
      "public-key-hex",
      BigInt(42),
    );
    expect(result).toEqual({ transaction: "raw-serialized-tx" });
  });
});
