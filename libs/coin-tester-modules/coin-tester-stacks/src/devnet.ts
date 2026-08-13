import { spawn, type ChildProcess } from "node:child_process";
import { exec } from "node:child_process";
import path from "node:path";
import chalk from "chalk";

// Matches `settings/Devnet.toml`'s `stacks_api_port` (left at Clarinet's own default), which in
// turn matches `@stacks/network`'s `HIRO_MOCKNET_DEFAULT`/`StacksDevnet` default URL — a
// reassuring cross-check, not a coincidence this package relies on.
export const STACKS_DEVNET_URL = "http://127.0.0.1:3999";

const CONTAINER_NAME = "coin-tester-stacks-devnet";
const CLARINET_IMAGE = "ghcr.io/stx-labs/clarinet:latest";
const PACKAGE_ROOT = path.resolve(__dirname, "..");

let clarinetProcess: ChildProcess | null = null;

async function waitUntilReady(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${STACKS_DEVNET_URL}/v2/info`);
      if (res.ok) return;
    } catch {
      // Devnet not reachable yet — bitcoind + the stacks-node + the bundled stacks-blockchain-api
      // + postgres all have to come up before the first burn block is mined.
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error(
    `coin-tester-stacks: devnet never became ready at ${STACKS_DEVNET_URL} within ${timeoutMs}ms`,
  );
}

/**
 * Spawns a local Clarinet devnet (bitcoind regtest + stacks-node + stacks-signer + the bundled
 * stacks-blockchain-api/Postgres pair — bundled by default, verified against
 * `NetworkManifest`'s `DevnetConfig` in the `clarinet` source, not assumed) by running
 * `clarinet integrate` inside the project's own published Docker image rather than requiring a
 * host-installed `clarinet` binary (`clarinet` ships as release binaries/Homebrew/winget, not an
 * npm package). The container needs the host's Docker socket mounted so the CLI can orchestrate
 * the sibling containers it manages internally (docker-outside-of-docker), and `--manifest-path`
 * lets Clarinet be pointed at this package's `Clarinet.toml`/`settings/Devnet.toml` regardless of
 * the working directory it's invoked from.
 *
 * Verified against a real, working Docker daemon (see the package README's "Known limitations"):
 * `clarinet integrate` genuinely reaches the container-boot sequence with this invocation, but the
 * `bitcoin-node` container itself currently fails to start (`JsonSerdeError` from Clarinet's own
 * Docker-API client) before any scenario transaction can run. Forcing `--platform linux/amd64`
 * (plus `DOCKER_DEFAULT_PLATFORM=linux/amd64` for any docker-cli/API calls Clarinet makes
 * internally) was tried as a fix for that failure and made no difference — same error, same point
 * of failure — so it was not kept here to avoid suggesting a fix that doesn't work.
 */
export async function spawnDevnet(): Promise<void> {
  console.log("Starting Stacks Clarinet devnet (this can take a few minutes)…");

  clarinetProcess = spawn(
    "docker",
    [
      "run",
      "--rm",
      "--name",
      CONTAINER_NAME,
      "--network",
      "host",
      "-v",
      `${PACKAGE_ROOT}:/workspace`,
      "-v",
      "/var/run/docker.sock:/var/run/docker.sock",
      "-w",
      "/workspace",
      CLARINET_IMAGE,
      "integrate",
      "--no-dashboard",
      "--manifest-path",
      "Clarinet.toml",
      // Without this, Clarinet tries to reuse its bundled snapshot and, finding this package's
      // `Devnet.toml` incompatible with it (no `pox_stacking_orders`, deliberately — this package
      // has no staking scenario), drops into an interactive "Do you want to continue? (y/N)"
      // confirmation on stdin. `--from-genesis` skips the snapshot entirely, which is also the
      // semantically correct choice for a from-scratch devnet with no prior chain state.
      "--from-genesis",
    ],
    // stdin is always closed (independent of DEBUG) so that if some other prompt is ever
    // triggered, it fails fast on a closed stdin instead of hanging.
    {
      stdio: [
        "ignore",
        process.env.DEBUG ? "inherit" : "ignore",
        process.env.DEBUG ? "inherit" : "ignore",
      ],
    },
  );

  clarinetProcess.on("error", err => {
    console.error(chalk.red("coin-tester-stacks: failed to spawn the clarinet container"), err);
  });

  await waitUntilReady(5 * 60 * 1000);
  console.log(chalk.bgBlueBright(" -  STACKS DEVNET READY ✅  - "));
}

export async function killDevnet(): Promise<void> {
  console.log("Stopping Stacks Clarinet devnet…");
  clarinetProcess?.kill("SIGTERM");
  clarinetProcess = null;

  // `clarinet integrate` owns a handful of sibling containers (bitcoind, stacks-node,
  // stacks-signer, stacks-blockchain-api, postgres) that killing its own process does not
  // necessarily tear down — force-remove the one container name we control directly; the rest are
  // named by Clarinet itself and are left to its own SIGTERM handling.
  await new Promise<void>(resolve => {
    exec(`docker rm -f ${CONTAINER_NAME}`, () => resolve());
  });
}
