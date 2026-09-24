import network from "@ledgerhq/live-network/network";
import { fetchBlockByHeight, fetchLatestBlock } from "./blocks";
import type { StacksCurrencyConfig } from "../config";

jest.mock("@ledgerhq/live-network/network");

let config: StacksCurrencyConfig;
const setEndpoint = (url: string) => {
  config = { status: { type: "active" }, infra: { API_STACKS_ENDPOINT: url } };
};

describe("network/blocks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setEndpoint("https://stacks.example");
  });

  it("fetchBlockByHeight requests the given height", async () => {
    (network as unknown as jest.Mock).mockResolvedValue({ data: { height: 42 } });

    await fetchBlockByHeight(config, 42);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://stacks.example/extended/v2/blocks/42",
      }),
    );
  });

  it("fetchLatestBlock requests the 'latest' alias", async () => {
    (network as unknown as jest.Mock).mockResolvedValue({ data: { height: 100 } });

    await fetchLatestBlock(config);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://stacks.example/extended/v2/blocks/latest" }),
    );
  });
});
