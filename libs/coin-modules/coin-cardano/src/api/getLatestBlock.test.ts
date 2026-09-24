import network from "@ledgerhq/live-network/network";
import { fetchLatestBlock } from "./getLatestBlock";
import { infraByCurrency, mockCardanoConfig } from "../test/coinConfig";

jest.mock("@ledgerhq/live-network/network");

const mockNetwork = jest.mocked(network);

describe("fetchLatestBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GETs the mainnet block/latest endpoint and returns the payload", async () => {
    mockNetwork.mockResolvedValue({ data: { blockHeight: 13494170 } } as never);

    const result = await fetchLatestBlock(mockCardanoConfig);

    expect(result).toEqual({ blockHeight: 13494170 });
    const call = mockNetwork.mock.calls[0][0];
    expect(call.method).toBe("GET");
    expect(call.url).toBe("https://cardano.coin.ledger.com/api/v1/block/latest");
  });

  it("reads the testnet currency's own endpoint", async () => {
    mockNetwork.mockResolvedValue({ data: { blockHeight: 1 } } as never);

    await fetchLatestBlock({ ...mockCardanoConfig, infra: infraByCurrency.cardano_testnet });

    expect(mockNetwork.mock.calls[0][0].url).toBe(
      "https://ledger-preprod.cardanoscan.io/api/v1/block/latest",
    );
  });
});
