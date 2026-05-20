import chalk from "chalk";
import * as compose from "docker-compose";

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
  console.log(chalk.bgBlueBright(" -  FLEXTESA READY ✅  - "));
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
          callback: (chunk) => {
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
                .then(() => {
                  resolve({ operationHash: operationHash!, branch: branch! });
                })
                .catch(() => reject(new Error(`Operation ${operationHash} was not included`)));
            }
          },
        },
      )
      .catch(() => reject(new Error(`Failed to fund ${address}`)));
  });
}

/**
 * Polls the local Tezos RPC until `operationHash` appears in a baked block,
 * scanning from `afterLevel` onwards.  Called by the test scenario's
 * `mockIndexer` hook so that `expectHandler` always runs after the operation
 * is on-chain, eliminating the retry loop in the coin-tester framework.
 */
export async function waitForOperationInclusion(
  operationHash: string,
  afterLevel: number,
): Promise<void> {
  let checkedUpTo = afterLevel - 1;
  for (;;) {
    const headRes = await fetch(`${TEZOS_RPC}/chains/main/blocks/head/header`).catch(() => null);
    if (headRes?.ok) {
      const head = (await headRes.json()) as { level: number };
      for (let level = checkedUpTo + 1; level <= head.level; level++) {
        const hashesRes = await fetch(
          `${TEZOS_RPC}/chains/main/blocks/${level}/operation_hashes/3`,
        ).catch(() => null);
        if (hashesRes?.ok) {
          const groups = (await hashesRes.json()) as string[][];
          if (groups.some((group) => group.includes(operationHash))) return;
        }
        checkedUpTo = level;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map((e) =>
  process.on(e, async () => {
    await killFlextesa();
  }),
);
