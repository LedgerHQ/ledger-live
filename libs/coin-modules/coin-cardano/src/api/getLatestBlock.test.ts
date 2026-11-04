import network from "@ledgerhq/live-network/network";
import { cardanoCoinConfig, cardanoTestnetCoinConfig } from "../fixtures/config";
import { fetchLatestBlock } from "./getLatestBlock";

jest.mock("@ledgerhq/live-network/network");

const mockNetwork = jest.mocked(network);

describe("fetchLatestBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should use the mainnet API endpoint from the coin config", async () => {
    mockNetwork.mockResolvedValue({ data: { blockHeight: 13494170 } } as never);

    const result = await fetchLatestBlock(cardanoCoinConfig);

    expect(result).toEqual({ blockHeight: 13494170 });
    expect(mockNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: "https://cardano.coin.ledger.com/api/v1/block/latest",
    });
  });

  it("should use the testnet API endpoint from the coin config", async () => {
    mockNetwork.mockResolvedValue({ data: { blockHeight: 1 } } as never);

    await fetchLatestBlock(cardanoTestnetCoinConfig);

    expect(mockNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: "https://ledger-preprod.cardanoscan.io/api/v1/block/latest",
    });
  });
});
