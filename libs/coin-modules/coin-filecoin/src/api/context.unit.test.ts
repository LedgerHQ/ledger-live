import network from "@ledgerhq/live-network";
import coinConfig from "../config";
import { createMockFilecoinContext, mockFilecoinConfig } from "../test/context";
import { createApi } from ".";

jest.mock("@ledgerhq/live-network");
jest.mock("@ledgerhq/logs");

const mockedNetwork = jest.mocked(network);

describe("createApi", () => {
  beforeEach(() => {
    // The api path must not depend on the module singleton, whatever it holds.
    coinConfig.setCoinConfig(() => {
      throw new Error("coin-config singleton read on the api path");
    });
    mockedNetwork.mockResolvedValue({
      data: {
        current_block_identifier: { index: 1, hash: "hash" },
        current_block_timestamp: 0,
      },
    } as Awaited<ReturnType<typeof network>>);
  });

  afterEach(() => {
    coinConfig.setCoinConfig(() => mockFilecoinConfig);
  });

  it("resolves the endpoint from the context config", async () => {
    const context = createMockFilecoinContext({
      ...mockFilecoinConfig,
      infra: { API_FILECOIN_ENDPOINT: "https://from-context.invalid" },
    });

    await createApi().lastBlock(context);

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://from-context.invalid/v2/network/status" }),
    );
  });
});
