import { Keypair } from "@solana/web3.js";
import { getChainAPI } from "../../network";
import { endpointByCurrencyId } from "../../utils";
import { getBalance } from "../getBalance";
import type { Balance } from "@ledgerhq/coin-module-framework/api/types";

const api = getChainAPI({ endpoint: endpointByCurrencyId("solana") });

const FUNDED_ADDRESS = "7V4CBuNyQaAhZVHf3fgsNxpk32bR61XRVZuAdR7isRu9";
const UNFUNDED_ADDRESS = Keypair.generate().publicKey.toBase58();

function expectStakeBalance(balance: Balance) {
  expect(balance.value).toBeGreaterThanOrEqual(0n);
  expect(balance).toMatchObject({
    asset: { type: "native" },
    stake: expect.objectContaining({
      asset: { type: "native" },
      address: expect.stringMatching(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
      delegate: expect.stringMatching(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
      state: expect.any(String),
      actions: expect.any(Array),
    }),
  });
  expect(["active", "inactive", "activating", "deactivating"]).toContain(balance.stake?.state);

  expect(balance.stake?.actions.length).toBeGreaterThan(0);
  for (const action of balance.stake?.actions ?? []) {
    expect(["delegate", "redelegate", "undelegate", "claim_reward"]).toContain(action);
  }
}

function expectTokenBalance(balance: Balance) {
  expect(balance.asset.type).toMatch(/^spl-token(-2022)?$/);
  expect(balance.asset).toHaveProperty(
    "assetReference",
    expect.stringMatching(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  );
  expect(balance.asset).toHaveProperty("assetOwner", FUNDED_ADDRESS);
  expect(balance.value).toBeGreaterThanOrEqual(0n);
}

describe("getBalance (integration)", () => {
  it("returns native balance for a funded account", async () => {
    const balances = await getBalance(api, FUNDED_ADDRESS);

    expect(balances.length).toBeGreaterThanOrEqual(1);

    const [native, stake1, stake2, stake3, ...tokenBalances] = balances;

    expect(native.asset).toEqual({ type: "native" });
    expect(native.value).toBeGreaterThan(0n);
    expect(native.locked).toBeGreaterThan(0n);

    expectStakeBalance(stake1);
    expectStakeBalance(stake2);
    expectStakeBalance(stake3);

    for (const b of tokenBalances) {
      expectTokenBalance(b);
    }
  });

  it("returns zero balance for an unfunded account", async () => {
    const balances = await getBalance(api, UNFUNDED_ADDRESS);

    expect(balances).toHaveLength(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].value).toBe(0n);
    expect(balances[0].locked).toBe(0n);
  });
});
