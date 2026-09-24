import network from "@ledgerhq/live-network/network";
import { setCoinConfig } from "../config";
import { createMockStacksContext, mockStacksConfig } from "../test/context";
import { createApi } from ".";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);

describe("createApi", () => {
  beforeEach(() => {
    // The api path must not depend on the module singleton, whatever it holds.
    setCoinConfig(() => {
      throw new Error("coin-config singleton read on the api path");
    });
    mockedNetwork.mockResolvedValue({ data: { possible_next_nonce: 7 } } as Awaited<
      ReturnType<typeof network>
    >);
  });

  afterEach(() => {
    setCoinConfig(() => mockStacksConfig);
  });

  it("resolves the endpoint from the context config", async () => {
    const context = createMockStacksContext({
      ...mockStacksConfig,
      infra: { API_STACKS_ENDPOINT: "https://from-context.invalid" },
    });

    await expect(
      createApi().getNextSequence(context, "SP000000000000000000002Q6VF78"),
    ).resolves.toBe(7n);

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://from-context.invalid/extended/v1/address/SP000000000000000000002Q6VF78/nonces",
      }),
    );
  });
});
