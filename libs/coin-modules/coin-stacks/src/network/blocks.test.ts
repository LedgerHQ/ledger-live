import * as env from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { fetchBlockByHeight, fetchLatestBlock } from "./blocks";

jest.mock("@ledgerhq/live-env");
jest.mock("@ledgerhq/live-network/network");

describe("network/blocks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (env.getEnv as jest.Mock).mockReturnValue("https://stacks.example");
  });

  it("fetchBlockByHeight requests the given height", async () => {
    (network as unknown as jest.Mock).mockResolvedValue({ data: { height: 42 } });

    await fetchBlockByHeight(42);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: "https://stacks.example/extended/v2/blocks/42",
      }),
    );
  });

  it("fetchLatestBlock requests the 'latest' alias", async () => {
    (network as unknown as jest.Mock).mockResolvedValue({ data: { height: 100 } });

    await fetchLatestBlock();

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://stacks.example/extended/v2/blocks/latest" }),
    );
  });
});
