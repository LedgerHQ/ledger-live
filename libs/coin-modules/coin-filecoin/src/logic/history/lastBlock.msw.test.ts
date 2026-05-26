import { getEnv } from "@ledgerhq/live-env";
import { lastBlock } from "./lastBlock";
import {
  server,
  filecoinHandlers,
  TEST_ENDPOINT,

} from "../tests/helpers/msw-api.mock";

jest.mock("@ledgerhq/live-env");
jest.mocked(getEnv).mockImplementation((key: string) => {
  if (key === "API_FILECOIN_ENDPOINT") return TEST_ENDPOINT;
  return "" as any;
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("lastBlock (MSW integration)", () => {
  it("returns block info from the Filecoin API", async () => {
    server.use(
      ...filecoinHandlers({
        getNetworkStatus: () => ({
          current_block_identifier: { index: 3500000, hash: "bafy2bzaced" },
          genesis_block_identifier: { index: 0, hash: "bafy2genesis" },
          current_block_timestamp: 1716000000,
        }),
      }),
    );

    const result = await lastBlock();

    expect(result.height).toBe(3500000);
    expect(result.hash).toBe("bafy2bzaced");
    expect(result.time).toEqual(new Date(1716000000 * 1000));
  });

  it("returns a recent block height greater than zero", async () => {
    server.use(
      ...filecoinHandlers({
        getNetworkStatus: () => ({
          current_block_identifier: { index: 1, hash: "h" },
          genesis_block_identifier: { index: 0, hash: "g" },
          current_block_timestamp: 1700000000,
        }),
      }),
    );

    const result = await lastBlock();
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
