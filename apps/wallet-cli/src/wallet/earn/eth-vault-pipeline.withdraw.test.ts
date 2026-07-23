import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import type { AccountDescriptor } from "../models";
import type { CommandOutput } from "../../output";
import type { WalletAdapter } from "../index";
import type { DefiProduct, EthTxStatus } from "./api.types";
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

// Mutable so each test can drive the poll's terminal status (success vs reverted).
let ethTxStatus: EthTxStatus = "success";
// Capture the last /v1/defi/withdraw request body so tests can assert the amount sent.
let lastWithdrawRequest: Record<string, unknown> | undefined;

const signAndBroadcastIntent = mock(async (_params: unknown) => ({ txHash: "0xdeadbeef" }));

// Scope these earn-api + sign-and-broadcast fakes to this file's tests only (see the mock helpers for
// the why — Bun's mock.module is process-global, so we gate the overrides behind an active flag).
beforeAll(() => {
  activateEarnApiMock({
    getDefiProducts: async () => [PRODUCT],
    postDefiWithdraw: async (request: Record<string, unknown>) => {
      lastWithdrawRequest = request;
      return {
        status: 200,
        kind: "transaction",
        data: {
          wallet: "0x1111111111111111111111111111111111111111",
          to: PRODUCT.vault,
          data: "0xba087652",
          value: "0",
          nonce: 0,
          gas_limit: 300_000,
          chain_id: 1,
        },
      };
    },
    postDefiApprove: async () => {
      throw new Error("postDefiApprove should not be called by withdraw");
    },
    postDefiDeposit: async () => {
      throw new Error("postDefiDeposit should not be called by withdraw");
    },
    getEthTxStatus: async () => ({ data: { status: ethTxStatus } }),
  });
  activateSignBroadcastMock({
    signAndBroadcastIntent,
    prepareIntentDryRun: async () => ({}),
  });
});

const { withdrawEvm } = await import("./eth-vault-pipeline");

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

afterEach(() => {
  ethTxStatus = "success";
  lastWithdrawRequest = undefined;
});

afterAll(() => {
  // Release this file's fakes so they don't bleed into sibling test files when the whole directory runs
  // in one bun process.
  deactivateEarnApiMock();
  deactivateSignBroadcastMock();
});

describe("withdrawEvm", () => {
  it("redeems from the vault and reports success once the tx confirms", async () => {
    ethTxStatus = "success";
    const result = await withdrawEvm({
      descriptor,
      network: "ethereum:main",
      productId: PRODUCT.id,
      amount: "50 USDC",
      dryRun: false,
      wallet,
      out,
      device: { deviceId: "device-1", managerAppName: "Ethereum", deviceTimeoutMs: 1000 },
    });

    expect(signAndBroadcastIntent).toHaveBeenCalled();
    expect(lastWithdrawRequest?.amount).toBe("50000000");
    expect(result.transactions.map(t => t.kind)).toEqual(["redeem"]);
    const redeem = result.transactions[0];
    expect(redeem.hash).toBe("0xdeadbeef");
    expect(redeem.status).toBe("success");
    expect(result.status).toBe("success");
  });

  it("throws when the redeem transaction reverts on-chain instead of reporting success", async () => {
    ethTxStatus = "error";
    await expect(
      withdrawEvm({
        descriptor,
        network: "ethereum:main",
        productId: PRODUCT.id,
        amount: "50 USDC",
        dryRun: false,
        wallet,
        out,
        device: { deviceId: "device-1", managerAppName: "Ethereum", deviceTimeoutMs: 1000 },
      }),
    ).rejects.toThrow(/reverted on-chain/);
  });

  it("rejects an amount whose ticker does not match the vault asset", async () => {
    await expect(
      withdrawEvm({
        descriptor,
        network: "ethereum:main",
        productId: PRODUCT.id,
        amount: "50 DAI",
        dryRun: false,
        wallet,
        out,
        device: { deviceId: "device-1", managerAppName: "Ethereum", deviceTimeoutMs: 1000 },
      }),
    ).rejects.toThrow(/does not match the vault asset/);
  });

  it('redeems the full balance with amount:"max" when no --amount is given', async () => {
    ethTxStatus = "success";
    const result = await withdrawEvm({
      descriptor,
      network: "ethereum:main",
      productId: PRODUCT.id,
      amount: undefined,
      dryRun: false,
      wallet,
      out,
      device: { deviceId: "device-1", managerAppName: "Ethereum", deviceTimeoutMs: 1000 },
    });

    // Full exit sends the "max" sentinel rather than a computed asset amount.
    expect(lastWithdrawRequest?.amount).toBe("max");
    // The redeem tx is still target/zero-value asserted and reported as a success.
    expect(result.transactions.map(t => t.kind)).toEqual(["redeem"]);
    const redeem = result.transactions[0];
    expect(redeem.to).toBe(PRODUCT.vault);
    expect(redeem.status).toBe("success");
    expect(result.status).toBe("success");
    expect(result.amount).toBe("max (full balance)");
  });
});
