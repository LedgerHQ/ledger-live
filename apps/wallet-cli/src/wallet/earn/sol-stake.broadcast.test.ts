import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { AccountDescriptor } from "../models";
import type { CommandOutput } from "../../output";
import type { WalletAdapter } from "../index";
import type { EarnDeviceContext } from "./device-context";
import {
  activateSignBroadcastMock,
  deactivateSignBroadcastMock,
} from "./__test-helpers__/sign-and-broadcast-mock";

// The live (broadcast) path runs through the shared sign-and-broadcast helper, which opens a device
// session and calls wallet.send. Replace it with a double whose returned txHash we control, so we can
// drive the "no broadcast hash" guard without a real device.
//
// bun's mock.module is process-global, not scoped per test file, so we go through the shared gated
// helper: it keeps every real export (notably prepareIntentDryRun, which sol-stake.test.ts's dry-run
// tests depend on) and only overrides signAndBroadcastIntent while THIS file's tests are running.
let nextTxHash: string | undefined = "0xsolsig";
const signAndBroadcastIntent = mock(async () => ({ txHash: nextTxHash }));

beforeAll(() => {
  activateSignBroadcastMock({ signAndBroadcastIntent });
});

const { depositSolana, withdrawSolana } = await import("./sol-stake");

afterAll(() => {
  // Release this file's fake so the sign-and-broadcast double does not bleed into sibling test files
  // when the whole earn directory runs in one bun process.
  deactivateSignBroadcastMock();
});

const descriptor = {
  id: "solana:1:solana:addr123:solanaMain:0",
  currencyId: "solana",
  freshAddress: "addr123",
  seedIdentifier: "addr123",
  derivationMode: "solanaMain",
  index: 0,
} as unknown as AccountDescriptor;

const wallet = {} as unknown as WalletAdapter;

const out = {
  spin: () => null,
  sendEvent: () => {},
  sendComplete: () => {},
  sendDryRun: () => {},
  deviceState: () => {},
} as unknown as CommandOutput;

const device: EarnDeviceContext = { deviceId: "device-1", managerAppName: "Solana" };

beforeEach(() => {
  nextTxHash = "0xsolsig";
  signAndBroadcastIntent.mockClear();
});

describe("depositSolana live broadcast", () => {
  it("broadcasts a stake.createAccount and reports the hash + broadcasted status", async () => {
    const result = await depositSolana({
      descriptor,
      network: "solana:main",
      validator: "voteAcc123",
      amount: "1.5 SOL",
      dryRun: false,
      wallet,
      out,
      device,
    });

    expect(signAndBroadcastIntent).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("broadcasted");
    expect(result.transactions).toEqual([
      { kind: "stake.createAccount", hash: "0xsolsig", status: "broadcasted" },
    ]);
  });

  it("throws instead of reporting a hash-less success when no broadcast hash comes back", async () => {
    nextTxHash = undefined;
    await expect(
      depositSolana({
        descriptor,
        network: "solana:main",
        validator: "voteAcc123",
        amount: "1.5 SOL",
        dryRun: false,
        wallet,
        out,
        device,
      }),
    ).rejects.toThrow(/no broadcast hash was returned/);
  });

  it("requires a device context for the live path", async () => {
    await expect(
      depositSolana({
        descriptor,
        network: "solana:main",
        validator: "voteAcc123",
        amount: "1.5 SOL",
        dryRun: false,
        wallet,
        out,
      }),
    ).rejects.toThrow(/Device context is required/);
  });
});

describe("withdrawSolana live broadcast", () => {
  it("throws when the undelegate is signed but no broadcast hash is returned", async () => {
    nextTxHash = undefined;
    await expect(
      withdrawSolana({
        descriptor,
        network: "solana:main",
        stakeAccount: "stakeAcc456",
        finalize: false,
        dryRun: false,
        wallet,
        out,
        device,
      }),
    ).rejects.toThrow(/no broadcast hash was returned/);
  });
});
