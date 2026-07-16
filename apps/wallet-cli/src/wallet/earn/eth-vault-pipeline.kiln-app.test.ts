import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import type { AccountDescriptor } from "../models";
import type { CommandOutput } from "../../output";
import type { WalletAdapter } from "../index";
import type { DefiProduct } from "./api.types";
import { activateEarnApiMock, deactivateEarnApiMock } from "./__test-helpers__/earn-api-mock";
import {
  activateSignBroadcastMock,
  deactivateSignBroadcastMock,
} from "./__test-helpers__/sign-and-broadcast-mock";

const PRODUCT: DefiProduct = {
  id: "usdc-vault",
  chain: "eth",
  chain_id: 1,
  address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  vault: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  asset: "0xcccccccccccccccccccccccccccccccccccccccc",
  asset_symbol: "USDC",
  asset_decimals: 6,
};

// Capture the params the pipeline passes to the shared signer so we can assert the device app.
const signAndBroadcastIntent = mock(async (_params: unknown) => ({ txHash: "0xdeadbeef" }));

// Scope these earn-api + sign-and-broadcast fakes to this file's tests only (see the mock helpers for
// the why — Bun's mock.module is process-global, so we gate the overrides behind an active flag).
beforeAll(() => {
  activateEarnApiMock({
    getDefiProducts: async () => [PRODUCT],
    // 204 no-action: the allowance is already sufficient, so only the deposit leg signs.
    postDefiApprove: async () => ({ status: 204, kind: "no-action" }),
    postDefiDeposit: async () => ({
      status: 200,
      kind: "transaction",
      data: {
        wallet: "0x1111111111111111111111111111111111111111",
        to: PRODUCT.vault,
        data: "0x6e553f65",
        value: "0",
        nonce: 0,
        gas_limit: 1_200_000,
        chain_id: 1,
      },
    }),
    postDefiWithdraw: async () => {
      throw new Error("postDefiWithdraw should not be called");
    },
    getEthTxStatus: async () => ({ data: { status: "success" } }),
  });
  activateSignBroadcastMock({
    signAndBroadcastIntent,
    prepareIntentDryRun: async () => ({}),
  });
});

const { depositEvm } = await import("./eth-vault-pipeline");

afterAll(() => {
  // Release this file's fakes so they don't bleed into sibling test files when the whole directory runs
  // in one bun process.
  deactivateEarnApiMock();
  deactivateSignBroadcastMock();
});

const descriptor = {
  id: "acc-1",
  currencyId: "ethereum",
  freshAddress: "0x1111111111111111111111111111111111111111",
} as unknown as AccountDescriptor;

const wallet = {} as unknown as WalletAdapter;

const out = {
  spin: () => null,
  sendEvent: () => {},
  sendComplete: () => {},
  deviceState: () => {},
} as unknown as CommandOutput;

describe("depositEvm device app", () => {
  it("keeps the Ethereum app but passes the Kiln app dependency to clear-sign vault calldata", async () => {
    const result = await depositEvm({
      descriptor,
      network: "ethereum:main",
      productId: PRODUCT.id,
      amount: "100 USDC",
      dryRun: false,
      wallet,
      out,
      device: { deviceId: "device-1", managerAppName: "Ethereum", deviceTimeoutMs: 1000 },
    });

    expect(signAndBroadcastIntent).toHaveBeenCalledTimes(1);
    const params = signAndBroadcastIntent.mock.calls[0]?.[0] as {
      managerAppName: string;
      dependencies?: Array<{ name: string }>;
    };
    // The currency app is unchanged; Kiln is requested as an installed dependency.
    expect(params.managerAppName).toBe("Ethereum");
    expect(params.dependencies).toEqual([{ name: "Kiln" }]);
    expect(result.transactions.map(t => t.kind)).toEqual(["deposit"]);
  });
});
