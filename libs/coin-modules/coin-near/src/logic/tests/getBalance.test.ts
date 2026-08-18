import { mockNearContext } from "../../test/context";
import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../../network/node.mock";
import { getActionCosts } from "../../network/protocolConfig";
import { getBalance } from "../getBalance";

const ADDRESS = "delegator.near";

const runtimeConfig = {
  storage_amount_per_byte: "10000000000000000000",
  transaction_costs: {
    action_creation_config: {
      add_key_cost: { full_access_cost: { execution: 0, send_not_sir: 0 } },
      create_account_cost: { execution: 0, send_not_sir: 0 },
      transfer_cost: { execution: 0, send_not_sir: 0 },
    },
    action_receipt_creation_config: { execution: 0, send_not_sir: 0 },
  },
};

const mockAccount = (amount: string): void => {
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
      HttpResponse.json([]),
    ),
    http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
      const body = (await request.json()) as { method: string; params: { request_type?: string } };

      if (body.method === "EXPERIMENTAL_protocol_config") {
        return HttpResponse.json({ result: { runtime_config: runtimeConfig } });
      }
      if (body.params?.request_type === "view_account") {
        return HttpResponse.json({ result: { amount, storage_usage: 182, block_height: 1 } });
      }
      return HttpResponse.json({ jsonrpc: "2.0", id: "id", result: {} });
    }),
  );
};

describe("getBalance (MSW)", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => getActionCosts.reset());
  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("reports the account total as value, and the storage reserve as locked", async () => {
    mockAccount("1000000000000000000000000");

    const [native] = await getBalance(mockNearContext, ADDRESS);

    expect(native.asset).toEqual({ type: "native" });
    expect(native.stake).toBeUndefined();
    expect(native.value).toBe(1_000_000_000_000_000_000_000_000n);
    // storageCost(1e19) * storage_usage(182) + MIN_ACCOUNT_BALANCE_BUFFER(5e22)
    expect(native.locked).toBe(51_820_000_000_000_000_000_000n);
  });

  it("never locks more than the account holds", async () => {
    mockAccount("1000000000000000000000"); // below the reserve

    const [native] = await getBalance(mockNearContext, ADDRESS);

    expect(native.value).toBe(1_000_000_000_000_000_000_000n);
    expect(native.locked).toBe(native.value);
  });
});
