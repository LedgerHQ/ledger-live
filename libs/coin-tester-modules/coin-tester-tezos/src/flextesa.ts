import chalk from "chalk";
import * as compose from "docker-compose";
import { ALICE_BAKER_ADDRESS } from "./fixtures";

export const TEZOS_RPC = "http://127.0.0.1:20000";

const composeOptions = {
  cwd: __dirname,
  log: Boolean(process.env.DEBUG),
  env: process.env,
};

export async function spawnFlextesa(): Promise<void> {
  console.log("Starting Tezos sandbox (Flextesa)...");
  await compose.upOne("flextesa", {
    ...composeOptions,
    commandOptions: ["--wait"],
  });
  await waitForAlice();
  console.log(chalk.bgBlueBright(" -  FLEXTESA READY ✅  - "));
}

/**
 * Polls the RPC until alice's bootstrap account has a non-zero balance.
 * The Docker healthcheck passes as soon as the RPC responds, but alice's
 * account may still be initializing on slow runners.
 * Throws after `timeoutMs` (default 30 s) with a descriptive error.
 */
async function waitForAlice(timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${TEZOS_RPC}/chains/main/blocks/head/context/contracts/${ALICE_BAKER_ADDRESS}/balance`,
    ).catch(() => null);
    if (res?.ok) {
      const balance = parseInt((await res.json()) as string, 10);
      if (balance > 0) return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(
    `Flextesa: alice's bootstrap account (${ALICE_BAKER_ADDRESS}) had no balance after ${timeoutMs / 1000} s — sandbox may have failed to initialize.`,
  );
}

export async function killFlextesa(): Promise<void> {
  console.log("Stopping Tezos sandbox...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

/**
 * Transfers XTZ from alice (Flextesa bootstrap account) to a target address.
 *
 * Two-step approach mirroring the Solana `airdrop` pattern:
 *  1. Inject the transfer and capture the operation hash from stdout.
 *  2. Explicitly wait for that hash to be included using
 *     `octez-client wait for <hash> to be included --confirmations 2`,
 *     so we only continue once the balance is on-chain.
 */
export async function fundAccount(
  address: string,
  amountTez: number,
): Promise<{ operationHash: string; branch: string }> {
  return new Promise<{ operationHash: string; branch: string }>((resolve, reject) => {
    let operationHash: string | undefined;
    let branch: string | undefined;

    compose
      .exec(
        "flextesa",
        `octez-client --wait none transfer ${amountTez} from alice to ${address} --burn-cap 0.5`,
        {
          ...composeOptions,
          callback: chunk => {
            const text = chunk.toString();
            operationHash ??= /Operation hash is '([a-zA-Z0-9]+)'/.exec(text)?.[1];
            branch ??= /branch ([a-zA-Z0-9]+)/.exec(text)?.[1];
            if (operationHash && branch) {
              compose
                .exec(
                  "flextesa",
                  `octez-client wait for ${operationHash} to be included --confirmations 2 --branch ${branch}`,
                  composeOptions,
                )
                .then(() => resolve({ operationHash: operationHash!, branch: branch! }))
                .catch(() => reject(new Error(`Operation ${operationHash} was not included`)));
            }
          },
        },
      )
      .catch(() => reject(new Error(`Failed to fund ${address}`)));
  });
}

/**
 * Waits for `operationHash` to be included in a baked block with at least
 * 1 confirmation.  Called by the test scenario's `mockIndexer` hook so that
 * `expectHandler` always runs after the operation is on-chain, eliminating
 * the retry loop in the coin-tester framework.
 *
 * Delegates to `octez-client wait for … to be included` — the same mechanism
 * used by `fundAccount` — rather than polling the RPC manually.
 */
export async function waitForOperationInclusion(operationHash: string): Promise<void> {
  await compose
    .exec(
      "flextesa",
      `octez-client wait for ${operationHash} to be included --confirmations 1`,
      composeOptions,
    )
    .catch(() => {
      throw new Error(`Tezos: operation ${operationHash} was not included in a block.`);
    });
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killFlextesa();
  }),
);
