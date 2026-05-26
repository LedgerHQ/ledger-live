import { getEnv } from "@ledgerhq/live-env";
import { getBalance } from "./getBalance";
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

describe("getBalance (MSW integration)", () => {
  it("returns native balance from the Filecoin API", async () => {
    server.use(
      ...filecoinHandlers({
        getBalance: () => ({
          spendable_balance: "2500000000000000000",
          locked_balance: "500000000000000000",
          total_balance: "3000000000000000000",
        }),
      }),
    );

    const result = await getBalance("f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za");

    expect(result).toHaveLength(1);
    expect(result[0].asset).toEqual({ type: "native" });
    expect(result[0].value).toBe(2500000000000000000n);
    expect(result[0].locked).toBe(500000000000000000n);
  });

  it("returns zero balance for empty account", async () => {
    server.use(
      ...filecoinHandlers({
        getBalance: () => ({
          spendable_balance: "0",
          locked_balance: "0",
          total_balance: "0",
        }),
      }),
    );

    const result = await getBalance("f1empty");

    expect(result[0].value).toBe(0n);
    expect(result[0].locked).toBe(0n);
  });
});
