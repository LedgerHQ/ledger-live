import network from "@ledgerhq/live-network/network";
import coinConfig from "../config";
import { createMockBoilerplateContext, mockBoilerplateConfig } from "../test/context";
import { createApi } from ".";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);

describe("createApi", () => {
  beforeEach(() => {
    // The api path must not depend on the module singleton, whatever it holds.
    coinConfig.setCoinConfig(() => {
      throw new Error("coin-config singleton read on the api path");
    });
    mockedNetwork.mockResolvedValue({
      data: { blockHeight: 1, blockHash: "hash", timestamp: 0 },
    } as Awaited<ReturnType<typeof network>>);
  });

  it("resolves the endpoint from the context config", async () => {
    const context = createMockBoilerplateContext({
      ...mockBoilerplateConfig,
      infra: { ...mockBoilerplateConfig.infra, NODE_BOILERPLATE: "https://from-context.invalid" },
    });

    await createApi().lastBlock(context);

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://from-context.invalid/block/current" }),
    );
  });
});
