import network from "@ledgerhq/live-network/network";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import coinConfig, { type CardanoCoinConfig } from "../config";
import { mockCardanoConfig } from "../test/coinConfig";
import { createApi } from ".";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);

describe("createApi", () => {
  beforeEach(() => {
    // The api path must not depend on the module singleton, whatever it holds.
    coinConfig.setCoinConfig(() => {
      throw new Error("coin-config singleton read on the api path");
    });
    mockedNetwork.mockResolvedValue({ data: { blockHeight: 7, time: 0 } } as never);
  });

  afterEach(() => {
    coinConfig.setCoinConfig(() => mockCardanoConfig);
  });

  it("resolves the endpoint from the context config", async () => {
    const context: Context<CardanoCoinConfig> = {
      config: async () => ({
        ...mockCardanoConfig,
        infra: { ...mockCardanoConfig.infra, CARDANO_API_ENDPOINT: "https://from-context.invalid" },
      }),
      logger: () => {},
    };

    await createApi("cardano").lastBlock(context);

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://from-context.invalid/v1/block/latest" }),
    );
  });
});
