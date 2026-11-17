import { describe, it, expect, afterAll, beforeAll } from "bun:test";
import { MockServer } from "../../testing/mock-server";
import { MOCK_ETH_DESCRIPTOR } from "../../testing/constants";
import { earnResults, FakeEarnApi, FakeEvmNode, runEarn, VAULT } from "../../testing/earn-vault";

const ETH_ACCOUNT = { label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR };

/** The vault as the backend lists it without `field`, under its own id. */
function vaultWithout(field: keyof typeof VAULT) {
  const { [field]: _, ...rest } = VAULT;
  return { ...rest, id: `no-${field}` };
}

const FIELDS = ["chain_id", "asset_decimals", "vault", "asset"] as const;

describe("earn on a vault the backend lists without a required field", () => {
  const api = new FakeEarnApi();
  const server = new MockServer([
    { method: "GET", match: "/v1/defi/products", response: FIELDS.map(vaultWithout) },
    ...new FakeEvmNode([]).routes,
    ...api.routes,
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it.each([
    ["chain_id", 'Defi product no-chain_id is missing required integer field "chain_id".'],
    [
      "asset_decimals",
      'Defi product no-asset_decimals is missing required integer field "asset_decimals".',
    ],
    ["vault", 'Defi product no-vault is missing required field "vault".'],
    ["asset", 'Defi product no-asset is missing required field "asset".'],
  ] as const)("refuses a deposit into a vault without %s", async (field, message) => {
    const { stdout, exitCode } = await runEarn(
      ETH_ACCOUNT,
      ["deposit", "--account", "ethereum-1", "--product", `no-${field}`, "--amount", "100 USDC"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toBe(message);
    expect(api.posts).toEqual([]);
  });
});
