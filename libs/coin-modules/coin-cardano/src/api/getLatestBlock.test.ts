import network from "@ledgerhq/live-network/network";
import { cardanoCoinConfig as config } from "../fixtures/config";
import { isTestnet } from "../logic";
import { fetchLatestBlock } from "./getLatestBlock";

jest.mock("@ledgerhq/live-network/network");
jest.mock("../logic", () => ({ isTestnet: jest.fn() }));

const mockNetwork = jest.mocked(network);
const mockIsTestnet = jest.mocked(isTestnet);

// isTestnet is mocked, so the concrete config value is irrelevant to routing.

describe("fetchLatestBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GETs the mainnet block/latest endpoint and returns the payload", async () => {
    mockIsTestnet.mockReturnValue(false);
    mockNetwork.mockResolvedValue({ data: { blockHeight: 13494170 } } as never);

    const result = await fetchLatestBlock(config);

    expect(result).toEqual({ blockHeight: 13494170 });
    const call = mockNetwork.mock.calls[0][0];
    expect(call.method).toBe("GET");
    expect(call.url).toContain("cardano.coin.ledger.com");
    expect(call.url).toMatch(/\/v1\/block\/latest$/);
  });

  it("routes to the testnet endpoint for a testnet currency", async () => {
    mockIsTestnet.mockReturnValue(true);
    mockNetwork.mockResolvedValue({ data: { blockHeight: 1 } } as never);

    await fetchLatestBlock(config);

    expect(mockIsTestnet).toHaveBeenCalledWith(config);
    expect(mockNetwork.mock.calls[0][0].url).toContain("cardanoscan");
  });
});
