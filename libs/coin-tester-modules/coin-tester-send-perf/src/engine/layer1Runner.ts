import chalk from "chalk";
import * as compose from "docker-compose";
import { ethers } from "ethers";
import { assertRejection, BroadcastAttemptResult, SendPerfFixture } from "./fixtureTypes";

const cwd = `${__dirname}/../..`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ANVIL_RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";

export async function spawnSendPerfAnvil(): Promise<void> {
  const seed = process.env.SEED;
  if (!seed) {
    throw new Error("SEED env var required to start Anvil");
  }

  console.log("Starting send-perf Anvil...");
  await compose.upOne("anvil", {
    cwd,
    log: Boolean(process.env.DEBUG),
    env: { ...process.env, SEED: seed },
  });

  const provider = new ethers.JsonRpcProvider(ANVIL_RPC);
  for (let i = 0; i < 50; i++) {
    try {
      await provider.getBlockNumber();
      console.log(chalk.bgBlueBright(" -  SEND-PERF ANVIL READY  - "));
      return;
    } catch {
      await delay(200);
    }
  }

  throw new Error("Anvil did not become ready in time");
}

export async function killSendPerfAnvil(): Promise<void> {
  console.log("Stopping send-perf Anvil...");
  await compose.down({
    cwd,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
}

export async function broadcastRawTx(provider: ethers.JsonRpcProvider, signedTx: string): Promise<BroadcastAttemptResult> {
  try {
    const hash = await provider.send("eth_sendRawTransaction", [signedTx]);
    return { accepted: true, errorMessage: hash };
  } catch (err) {
    const error = err as Error & { code?: string; error?: { message?: string } };
    const message =
      error.error?.message ??
      error.message ??
      (typeof error === "object" ? JSON.stringify(error) : String(error));
    return {
      accepted: false,
      errorMessage: message,
      errorName: error.name,
    };
  }
}

export async function runLayer1Fixture(
  provider: ethers.JsonRpcProvider,
  fixture: SendPerfFixture,
  signedTx: string,
): Promise<void> {
  if (fixture.setup?.actions) {
    for (const action of fixture.setup.actions) {
      await applySetupAction(provider, action);
    }
  }

  const result = await broadcastRawTx(provider, signedTx);
  const alternates =
    fixture.id === "eth-already-known"
      ? ["already imported"]
      : fixture.id === "eth-replacement-underpriced"
        ? ["transaction underpriced", "fee too low", "nonce too low", "max fee per gas less than block base fee"]
        : [];
  assertRejection(fixture.id, result, fixture.expectReject, fixture.expectErrorClass, alternates);
}

async function applySetupAction(
  provider: ethers.JsonRpcProvider,
  action: SendPerfFixture["setup"] extends infer S
    ? S extends { actions: infer A }
      ? A extends Array<infer U>
        ? U
        : never
      : never
    : never,
): Promise<void> {
  switch (action.type) {
    case "anvil_setBalance":
      await provider.send("anvil_setBalance", [action.address, ethers.toBeHex(BigInt(action.wei))]);
      break;
    case "anvil_impersonate":
      await provider.send("anvil_impersonateAccount", [action.address]);
      break;
    case "anvil_stopImpersonate":
      await provider.send("anvil_stopImpersonatingAccount", [action.address]);
      break;
    case "send_and_mine": {
      const hash = await provider.send("eth_sendRawTransaction", [action.tx]);
      await provider.waitForTransaction(hash);
      break;
    }
    case "mine_blocks":
      await provider.send("anvil_mine", [ethers.toBeHex(action.count)]);
      break;
    default:
      throw new Error(`Unknown setup action: ${(action as { type: string }).type}`);
  }
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM"].forEach(signal => {
  process.on(signal, () => {
    void killSendPerfAnvil();
  });
});
