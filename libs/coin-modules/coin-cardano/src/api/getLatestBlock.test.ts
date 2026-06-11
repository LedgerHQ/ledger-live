import network from "@ledgerhq/live-network/network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isTestnet } from "../logic";
import { fetchLatestBlock } from "./getLatestBlock";

jest.mock("@ledgerhq/live-network/network");
jest.mock("../logic", () => ({ isTestnet: jest.fn() }));

const mockNetwork = jest.mocked(network);
const mockIsTestnet = jest.mocked(isTestnet);

// isTestnet is mocked, so the concrete currency value is irrelevant to routing.
const currency = { id: "cardano" } as CryptoCurrency;

describe("fetchLatestBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GETs the mainnet block/latest endpoint and returns the payload", async () => {
    mockIsTestnet.mockReturnValue(false);
    mockNetwork.mockResolvedValue({ data: { blockHeight: 13494170 } } as never);

    const result = await fetchLatestBlock(currency);

    expect(result).toEqual({ blockHeight: 13494170 });
    const call = mockNetwork.mock.calls[0][0];
    expect(call.method).toBe("GET");
    expect(call.url).toContain("cardano.coin.ledger.com");
    expect(call.url).toMatch(/\/v1\/block\/latest$/);
  });

  it("routes to the testnet endpoint for a testnet currency", async () => {
    mockIsTestnet.mockReturnValue(true);
    mockNetwork.mockResolvedValue({ data: { blockHeight: 1 } } as never);

    await fetchLatestBlock(currency);

    expect(mockIsTestnet).toHaveBeenCalledWith(currency);
    expect(mockNetwork.mock.calls[0][0].url).toContain("cardanoscan");
  });
});
