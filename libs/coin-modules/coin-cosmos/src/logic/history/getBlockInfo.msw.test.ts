import { http, HttpResponse } from "msw";
import { GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE } from "../../network/fixtures";
import { makeTestApi, server, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { getBlockInfo } from "./getBlockInfo";

const BLOCK_URL = `${TEST_COSMOS_ENDPOINT}/cosmos/base/tendermint/v1beta1/blocks/:height`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getBlockInfo via MSW", () => {
  it("returns the height, hash and time of the requested block", async () => {
    const requestedHeights: string[] = [];
    server.use(
      http.get(BLOCK_URL, ({ params }) => {
        requestedHeights.push(String(params.height));
        return HttpResponse.json(GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE);
      }),
    );

    const block = await getBlockInfo(makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 33721700);

    expect(requestedHeights).toEqual(["33721700"]);
    expect(block).toEqual({
      height: 33721700,
      hash: GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE.block_id.hash,
      time: new Date("2026-11-04T10:24:57.711662460Z"),
    });
  });

  it("falls back to the deprecated block field when sdk_block is absent", async () => {
    const { sdk_block: _sdkBlock, ...preSdk047 } = GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE;
    server.use(http.get(BLOCK_URL, () => HttpResponse.json(preSdk047)));

    const block = await getBlockInfo(makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 33721700);

    expect(block.height).toBe(33721700);
  });

  it("rejects when the height is above the chain length", async () => {
    server.use(
      http.get(BLOCK_URL, () =>
        HttpResponse.json(
          { code: 3, message: "requested block height is bigger then the chain length" },
          { status: 400 },
        ),
      ),
    );

    await expect(
      getBlockInfo(makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 999999999),
    ).rejects.toThrow("requested block height is bigger then the chain length");
  });

  it("rejects an invalid height without querying the network", async () => {
    await expect(getBlockInfo(makeTestApi("cosmos", TEST_COSMOS_ENDPOINT), 0)).rejects.toThrow(
      "Invalid block height: 0",
    );
  });
});
