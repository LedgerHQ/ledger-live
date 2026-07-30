import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";
import { getActionCosts } from "./protocolConfig";

const runtimeConfig = {
  storage_amount_per_byte: "10000000000000000000",
  transaction_costs: {
    action_creation_config: {
      add_key_cost: { full_access_cost: { execution: 101765125000, send_not_sir: 101765125000 } },
      create_account_cost: { execution: 99607375000, send_not_sir: 99607375000 },
      transfer_cost: { execution: 115123062500, send_not_sir: 115123062500 },
    },
    action_receipt_creation_config: { execution: 108059500000, send_not_sir: 108059500000 },
  },
};

const mockProtocolConfig = (result: unknown, onCall?: () => void) =>
  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
      const body = (await request.json()) as { method: string };
      if (body.method !== "EXPERIMENTAL_protocol_config") {
        return HttpResponse.json({ error: { message: `unexpected method ${body.method}` } });
      }
      onCall?.();
      return HttpResponse.json({ result });
    }),
  );

describe("getActionCosts", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => getActionCosts.reset());
  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("derives the storage price and per-action gas costs from the protocol config", async () => {
    mockProtocolConfig({ runtime_config: runtimeConfig });

    const costs = await getActionCosts();

    expect(costs.storageCost.toFixed()).toBe("10000000000000000000");
    expect(costs.transferCostSend.toFixed()).toBe("115123062500");
    expect(costs.transferCostExecution.toFixed()).toBe("115123062500");
    expect(costs.receiptCreationSend.toFixed()).toBe("108059500000");
    expect(costs.receiptCreationExecution.toFixed()).toBe("108059500000");
    expect(costs.createAccountCostSend.toFixed()).toBe("99607375000");
    expect(costs.createAccountCostExecution.toFixed()).toBe("99607375000");
    expect(costs.addKeyCostSend.toFixed()).toBe("101765125000");
    expect(costs.addKeyCostExecution.toFixed()).toBe("101765125000");
  });

  it("caches, so repeated pricing does not re-fetch the protocol config", async () => {
    let calls = 0;
    mockProtocolConfig({ runtime_config: runtimeConfig }, () => calls++);

    await getActionCosts();
    await getActionCosts();

    expect(calls).toBe(1);
  });

  it("throws when the node returns no protocol config", async () => {
    mockProtocolConfig(undefined);

    await expect(getActionCosts()).rejects.toThrow("NearProtocolConfigNotLoaded");
  });
});
