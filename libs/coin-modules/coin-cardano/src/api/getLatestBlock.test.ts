import network from "@ledgerhq/live-network/network";
import { cardanoCoinConfig as config, cardanoTestnetCoinConfig } from "../fixtures/config";
import { fetchLatestBlock } from "./getLatestBlock";

jest.mock("@ledgerhq/live-network/network");

const mockNetwork = jest.mocked(network);

describe("fetchLatestBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GETs block/latest on the configured API and returns the payload", async () => {
    mockNetwork.mockResolvedValue({ data: { blockHeight: 13494170 } } as never);

    const result = await fetchLatestBlock(config);

    expect(result).toEqual({ blockHeight: 13494170 });
    expect(mockNetwork).toHaveBeenCalledWith({
      method: "GET",
      url: `${config.api.url}/v1/block/latest`,
    });
  });

  it("uses the API of the testnet config for a testnet currency", async () => {
    mockNetwork.mockResolvedValue({ data: { blockHeight: 1 } } as never);

    await fetchLatestBlock(cardanoTestnetCoinConfig);

    expect(mockNetwork.mock.calls[0][0].url).toBe(
      `${cardanoTestnetCoinConfig.api.url}/v1/block/latest`,
    );
  });
});
