import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { useFreshCalCache } from "../../testing/cal-cache";
import { USDT_API_RESPONSE, USDT_CONTRACT } from "../../testing/cal-fixtures";
import { redirectHttpTo, runCli } from "../../testing/cli-runner";
import { ETH_ADDRESS, ETH_DESCRIPTOR } from "../../testing/constants";
import { MockServer, type Route } from "../../testing/mock-server";
import { makeSessionDir } from "../../testing/session-fixture";
import { parseV1, toV0 } from "../../shared/accountDescriptor";
import { CoinFrameworkAdapter } from "./coinframework";

const UNLISTED_CONTRACT = "0x00000000000000000000000000000000000000aa";
const RECIPIENT = "0xc79c7a29c40Ce8F5746af2c956F93F27e2820307";

const TOKEN_BALANCES: Record<string, string> = {
  [USDT_CONTRACT]: "1500000",
  [UNLISTED_CONTRACT]: "1",
};

const hash = (n: number) => `0x${n.toString(16).padStart(64, "0")}`;

/** An explorer transaction from the account on day `day` of June 2024, moving `transfers` ERC-20s. */
function explorerTx(day: number, transfers: string[] = []) {
  const time = `2024-06-${String(day).padStart(2, "0")}T12:00:00.000Z`;
  return {
    hash: hash(day),
    transaction_type: 2,
    nonce: `0x${day.toString(16)}`,
    nonce_value: day,
    value: transfers.length ? "0" : "100000000000000000",
    gas: "60000",
    gas_price: "20000000000",
    max_fee_per_gas: "30000000000",
    max_priority_fee_per_gas: "1000000000",
    from: ETH_ADDRESS,
    to: transfers[0] ?? RECIPIENT,
    transfer_events: transfers.map(contract => ({
      contract,
      from: ETH_ADDRESS,
      to: RECIPIENT,
      count: "1",
    })),
    erc721_transfer_events: [],
    erc1155_transfer_events: [],
    approval_events: [],
    actions: [],
    confirmations: 500,
    input: null,
    gas_used: "50000",
    cumulative_gas_used: "50000",
    status: 1,
    received_at: time,
    block: { hash: hash(1000 + day), height: 20_000_000 + day, time },
  };
}

function explorerRoutes(txs: ReturnType<typeof explorerTx>[]): Route[] {
  return [
    {
      method: "GET",
      match: /\/address\/[^/]+\/balance$/,
      response: { balance: "2000000000000000000" },
    },
    { method: "GET", match: /\/address\/[^/]+\/txs/, response: { data: txs, token: null } },
    {
      method: "POST",
      match: /erc20\/balances/,
      response: null,
      onRequest: async request => {
        const queries = (await request.json()) as { contract: string }[];
        return Response.json(
          queries.map(({ contract }) => ({
            balance: TOKEN_BALANCES[contract.toLowerCase()] ?? "0",
          })),
        );
      },
    },
    {
      method: "GET",
      match: new RegExp(`/v1/tokens.*contract_address=${USDT_CONTRACT}`, "i"),
      response: USDT_API_RESPONSE,
    },
    { method: "GET", match: /\/v1\/tokens/, response: [] },
  ];
}

describe("balances of an EVM account (CLI)", () => {
  const server = new MockServer(
    explorerRoutes([explorerTx(2, [USDT_CONTRACT, UNLISTED_CONTRACT])]),
  );
  let restoreCalCache: () => void;

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  beforeEach(() => {
    restoreCalCache = useFreshCalCache();
  });
  afterEach(() => restoreCalCache());

  async function balances(...args: string[]) {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    return runCli(["balances", "--account", "ethereum-1", ...args], {
      ...fixture.env,
      WALLET_CLI_MOCK_PORT: String(server.port),
    }).finally(fixture.cleanup);
  }

  it("lists the native balance and each token the account moved that CAL lists", async () => {
    const { stdout, stderr, exitCode } = await balances("--output", "json");

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(JSON.parse(stdout).balances).toEqual([
      { asset: "ethereum", amount: "2\u00a0ETH" },
      { asset: "ethereum/erc20/usd_tether__erc20_", amount: "1.5\u00a0USDT" },
    ]);
  });

  it("prints the token balances in human output without warning about unlisted tokens", async () => {
    const { stdout, stderr, exitCode } = await balances();

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toBe("2\u00a0ETH\n1.5\u00a0USDT (ethereum/erc20/usd_tether__erc20_)");
    expect(stderr).not.toContain("Skipped token");
  });
});

// `operations` reads history through the bridge, so the adapter's own paging runs directly.
describe("CoinFrameworkAdapter.getOperations", () => {
  const server = new MockServer(explorerRoutes([explorerTx(3), explorerTx(1)]));

  beforeAll(async () => {
    server.start();
    await redirectHttpTo(server.port);
  });
  afterAll(async () => {
    await redirectHttpTo(null);
    server.stop();
  });

  it("maps each native transaction of the explorer history to a CLI operation", async () => {
    const descriptor = toV0(parseV1(ETH_DESCRIPTOR));

    const { operations } = await new CoinFrameworkAdapter().getOperations(descriptor);

    expect(operations.map(op => [op.hash, op.blockHeight, op.date])).toEqual([
      [hash(3), 20_000_003, "2024-06-03T12:00:00.000Z"],
      [hash(1), 20_000_001, "2024-06-01T12:00:00.000Z"],
    ]);
    expect(operations[0]).toMatchObject({
      type: "OUT",
      value: "101000000000000000",
      fee: "1000000000000000",
      senders: [ETH_ADDRESS],
      recipients: [RECIPIENT],
      accountId: descriptor.id,
      assetId: "ethereum",
    });
  });
});
