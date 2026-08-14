import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

// Matches `settings/Devnet.toml`'s `stacks_api_port` (left at Clarinet's own default), which in
// turn matches `@stacks/network`'s `HIRO_MOCKNET_DEFAULT`/`StacksDevnet` default URL — a
// reassuring cross-check, not a coincidence this package relies on.
export const STACKS_DEVNET_URL = "http://127.0.0.1:3999";

// Matches `Clarinet.toml`'s `[project].name` + `settings/Devnet.toml`'s `[network].name` --
// Clarinet's own naming convention for the Docker network it creates for its sibling containers
// (bitcoind, stacks-node, stacks-signer, stacks-api, postgres).
const DEVNET_NETWORK_NAME = "coin-tester-stacks.devnet";
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const DOCKER_DIR = path.join(PACKAGE_ROOT, "docker", "clarinet");
// Pinned upstream commit `docker/clarinet/Dockerfile` builds from -- kept in one place so the
// cache key and the Dockerfile's own default stay in sync.
const CLARINET_COMMIT = "4220f34773a20960ce955a6b76590c97751e8a60";
const CACHE_DIR = path.join(PACKAGE_ROOT, ".clarinet-cache", CLARINET_COMMIT);
const CACHED_BINARY = path.join(CACHE_DIR, "clarinet");

/**
 * Produces a patched `clarinet` binary (see `docker/clarinet/bollard-fix.patch` for the two real
 * upstream bugs it fixes) and returns its path, building/caching it on first use only.
 *
 * Deliberately runs `clarinet` as a **native host process**, never inside a container: an earlier
 * version of this file ran `clarinet integrate` inside the patched Docker image, which works for
 * the `bollard` fix but hits a *different* problem -- `clarinet`'s own event-listener (which the
 * sibling containers it spawns must reach at `host.docker.internal:<port>`) is only reliably
 * reachable that way when `clarinet` itself runs on the real host. Running it inside a
 * `--network host` container hits real limitations of Docker Desktop for Mac's host-networking
 * support (verified: sibling containers get `ECONNREFUSED` reaching the orchestrator's own
 * listener). Building `clarinet` and then running the resulting binary directly on the host
 * sidesteps this entirely -- Docker is still used, but only the way `clarinet` itself already uses
 * it (to spawn its sibling containers), not to run `clarinet` itself.
 *
 * - On Linux, the binary is built *inside* Docker (matching the host architecture exactly) and
 *   extracted with `docker cp` -- no Rust toolchain needs to be installed on the host/CI runner.
 * - Elsewhere (e.g. macOS, where a container-built binary is a Linux ELF that can't run on the
 *   host at all), it's built with a local `cargo +nightly` instead -- requires `rustup` with the
 *   `nightly` toolchain installed locally; there is no way around a host-matching compile here.
 */
function ensureClarinetBinary(): string {
  if (fs.existsSync(CACHED_BINARY)) {
    return CACHED_BINARY;
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log(`Building patched clarinet binary (first run only, ~a few minutes)…`);

  if (process.platform === "linux") {
    const tag = "coin-tester-stacks-clarinet:builder";
    const build = spawnSync("docker", ["build", "--target", "builder", "-t", tag, DOCKER_DIR], {
      stdio: "inherit",
    });
    if (build.status !== 0) {
      throw new Error("coin-tester-stacks: failed to build the clarinet builder image");
    }

    const create = spawnSync("docker", ["create", tag], { encoding: "utf8" });
    if (create.status !== 0) {
      throw new Error(`coin-tester-stacks: failed to create a container from ${tag}`);
    }
    const containerId = create.stdout.trim();

    const cp = spawnSync("docker", [
      "cp",
      `${containerId}:/src/target/release/clarinet`,
      CACHED_BINARY,
    ]);
    spawnSync("docker", ["rm", containerId]);
    if (cp.status !== 0) {
      throw new Error(
        "coin-tester-stacks: failed to extract the clarinet binary from the builder image",
      );
    }
  } else {
    const sourceDir = path.join(CACHE_DIR, "src");
    if (!fs.existsSync(sourceDir)) {
      const clone = spawnSync(
        "git",
        ["clone", "https://github.com/stx-labs/clarinet.git", sourceDir],
        { stdio: "inherit" },
      );
      if (clone.status !== 0) {
        throw new Error("coin-tester-stacks: failed to clone stx-labs/clarinet");
      }
      spawnSync("git", ["checkout", CLARINET_COMMIT], { cwd: sourceDir, stdio: "inherit" });
      const apply = spawnSync("git", ["apply", path.join(DOCKER_DIR, "bollard-fix.patch")], {
        cwd: sourceDir,
        stdio: "inherit",
      });
      if (apply.status !== 0) {
        throw new Error("coin-tester-stacks: failed to apply bollard-fix.patch");
      }
    }

    const build = spawnSync("cargo", ["+nightly", "build", "--release", "-p", "clarinet-cli"], {
      cwd: sourceDir,
      stdio: "inherit",
    });
    if (build.status !== 0) {
      throw new Error(
        "coin-tester-stacks: failed to build clarinet-cli locally -- requires `rustup` with the " +
          "`nightly` toolchain installed (`rustup toolchain install nightly`)",
      );
    }
    fs.copyFileSync(path.join(sourceDir, "target", "release", "clarinet"), CACHED_BINARY);
  }

  fs.chmodSync(CACHED_BINARY, 0o755);
  return CACHED_BINARY;
}

let clarinetProcess: ChildProcess | null = null;
let bitcoinMinerProcess: ChildProcess | null = null;

/**
 * Works around a genuine upstream `clarinet` bug: `chains_coordinator.rs`'s
 * `handle_bitcoin_mining` is supposed to call bitcoind's `generatetoaddress` every
 * `bitcoin_controller_block_time` to keep the regtest chain progressing, but on several
 * verification runs it silently stopped doing so after mining exactly one block past genesis — no
 * error, no further log line, chain height frozen indefinitely. Verified this is not bitcoind's
 * fault: manually issuing the same `generatetoaddress` RPC call bitcoind itself (not through
 * `clarinet`) mines new blocks immediately and reliably every time.
 *
 * `scripts/bitcoin-miner.js` replaces Clarinet's own (broken) periodic miner with an equivalent
 * one, calling the exact same RPC bitcoind already exposes. It runs as a **separate OS process**,
 * not an in-process `setInterval`: an earlier version did exactly that in-process and was itself
 * unreliable, because Jest's own CPU-bound work (signing, `--runInBand` test execution) delays or
 * starves the shared event loop long enough to occasionally miss ticks for minutes — from the
 * test's point of view, indistinguishable from the original bug. A separate process has its own
 * event loop, unaffected by Jest's load.
 */
function startBitcoinMiningWorkaround(): void {
  bitcoinMinerProcess = spawn("node", [path.join(PACKAGE_ROOT, "scripts", "bitcoin-miner.js")], {
    stdio: ["ignore", process.env.DEBUG ? "inherit" : "ignore", "inherit"],
  });
  bitcoinMinerProcess.on("error", err => {
    console.error(
      chalk.red("coin-tester-stacks: failed to spawn the bitcoin mining workaround"),
      err,
    );
  });
}

async function waitUntilReady(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      // `/v2/info` only confirms the raw stacks-node is up; the bundled stacks-blockchain-api
      // (a separate container, serving the `/extended/...` surface coin-stacks actually calls)
      // can still be initializing/connecting to Postgres after that, so wait on its own readiness
      // instead — `status: "ready"` is what it reports once fully up.
      const res = await fetch(`${STACKS_DEVNET_URL}/extended`);
      if (res.ok) {
        const body = (await res.json()) as { status?: string };
        if (body.status === "ready") return;
      }
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
 * The devnet's own genesis deployment plan (`deployments/default.devnet-plan.yaml`) publishes
 * this package's `contracts/sip-010-test-token.clar` a handful of blocks after the chain boots
 * (batch 1, epoch 3.0) — stacks-api reporting "ready" only means the API/Postgres pair is up, not
 * that this later batch has actually been mined yet. Poll the contract-interface endpoint (200
 * once the contract exists on-chain, 404 until then) so scenario transactions never race a
 * not-yet-deployed contract.
 */
export async function waitForContractDeployment(
  deployerAddress: string,
  contractName: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const url = `${STACKS_DEVNET_URL}/v2/contracts/interface/${deployerAddress}/${contractName}`;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Devnet reachable but this contract's deployment batch hasn't been mined yet.
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error(
    `coin-tester-stacks: contract ${deployerAddress}.${contractName} was never deployed within ${timeoutMs}ms`,
  );
}

/**
 * Spawns a local Clarinet devnet (bitcoind regtest + stacks-node + stacks-signer + the bundled
 * stacks-blockchain-api/Postgres pair — bundled by default, verified against `NetworkManifest`'s
 * `DevnetConfig` in the `clarinet` source, not assumed) by running a patched `clarinet` binary
 * (see `ensureClarinetBinary`) directly on the host -- `clarinet` itself still talks to the local
 * Docker daemon to spawn/manage those sibling containers, exactly as it's designed to.
 */
export async function spawnDevnet(): Promise<void> {
  console.log("Starting Stacks Clarinet devnet (this can take a few minutes)…");

  // Defensive: a previous run that didn't exit cleanly (e.g. killed with `pkill` rather than
  // through `killDevnet`) can leave this devnet's containers/network running — verified this
  // happening for 27+ minutes, silently colliding with a later run on the same ports. Idempotent
  // if there's nothing to clean up.
  await killDevnet();

  const binary = ensureClarinetBinary();

  clarinetProcess = spawn(
    binary,
    ["integrate", "--no-dashboard", "--manifest-path", "Clarinet.toml", "--from-genesis"],
    {
      cwd: PACKAGE_ROOT,
      // stdin is always closed (independent of DEBUG) so that if some other prompt is ever
      // triggered (e.g. a genesis-snapshot mismatch prompt), it fails fast on a closed stdin
      // instead of hanging -- `--from-genesis` already avoids that specific prompt.
      stdio: [
        "ignore",
        process.env.DEBUG ? "inherit" : "ignore",
        process.env.DEBUG ? "inherit" : "ignore",
      ],
    },
  );

  clarinetProcess.on("error", err => {
    console.error(chalk.red("coin-tester-stacks: failed to spawn clarinet"), err);
  });

  await waitUntilReady(5 * 60 * 1000);
  startBitcoinMiningWorkaround();
  console.log(chalk.bgBlueBright(" -  STACKS DEVNET READY ✅  - "));
}

function execAsync(command: string): Promise<string> {
  return new Promise(resolve => {
    exec(command, (_err, stdout) => resolve(stdout.trim()));
  });
}

/**
 * `clarinet integrate`'s own SIGTERM handling only sometimes tears down every sibling container
 * (bitcoind, stacks-node, stacks-signer, stacks-blockchain-api, postgres) it spawned on this
 * devnet's Docker network -- verified the hard way: a previous run's `stacks-node`/`stacks-signer`
 * containers were still `Up` and bound to the real Stacks ports (20443-20444) 27 minutes after
 * that run's Jest process had already exited, silently colliding with a later run's freshly
 * spawned devnet. Force-remove every container actually on this devnet's network, then the
 * network itself, rather than relying on Clarinet's own cleanup or a single hardcoded name.
 */
export async function killDevnet(): Promise<void> {
  console.log("Stopping Stacks Clarinet devnet…");
  bitcoinMinerProcess?.kill("SIGTERM");
  bitcoinMinerProcess = null;
  clarinetProcess?.kill("SIGTERM");
  clarinetProcess = null;

  const containerIds = await execAsync(`docker ps -aq --filter "network=${DEVNET_NETWORK_NAME}"`);
  if (containerIds) {
    await execAsync(`docker rm -f ${containerIds.split("\n").join(" ")}`);
  }
  await execAsync(`docker network rm ${DEVNET_NETWORK_NAME}`);
}
