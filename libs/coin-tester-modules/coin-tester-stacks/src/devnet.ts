import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { exec } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import chalk from "chalk";

// Matches `settings/Devnet.toml`'s `stacks_api_port` (left at Clarinet's own default), which in
// turn matches `@stacks/network`'s `STACKS_DEVNET` default URL (`DEVNET_URL`) — a reassuring
// cross-check, not a coincidence this package relies on.
export const STACKS_DEVNET_URL = "http://127.0.0.1:3999";

// Matches `Clarinet.toml`'s `[project].name` + `settings/Devnet.toml`'s `[network].name` --
// Clarinet's own naming convention for the Docker network it creates for its sibling containers
// (bitcoind, stacks-node, stacks-signer, stacks-api, postgres).
const DEVNET_NETWORK_NAME = "coin-tester-stacks.devnet";
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const DOCKER_DIR = path.join(PACKAGE_ROOT, "docker", "clarinet");
// The patch files, applied in this order on top of the pinned Clarinet commit -- here for the local
// (non-Linux) build, in `docker/clarinet/Dockerfile` for the Linux one.
const CLARINET_PATCHES = [
  "bollard-fix.patch",
  "bitcoin-node-patience.patch",
  "bitcoin-node-no-autoremove.patch",
  "bitcoin-node-datadir-permissions.patch",
  "bitcoin-node-snapshot-ownership.patch",
];

/**
 * Reads an `ARG NAME=value` default from `docker/clarinet/Dockerfile`, the single source for the
 * pinned Clarinet commit and Rust toolchain: the Docker build uses them directly, the local build
 * reads them here.
 */
function readDockerfileArg(name: string): string {
  const dockerfile = fs.readFileSync(path.join(DOCKER_DIR, "Dockerfile"), "utf8");
  const match = new RegExp(`^ARG ${name}=(\\S+)$`, "m").exec(dockerfile);
  if (!match) {
    throw new Error(`coin-tester-stacks: no \`ARG ${name}=\` found in docker/clarinet/Dockerfile`);
  }
  return match[1];
}

/**
 * Hash of every file in `docker/clarinet/` (Dockerfile + patches), i.e. every input of the Clarinet
 * build: the pinned commit, the patches and the toolchain. The local cache directory is named after
 * it, so changing any of them rebuilds, and CI's cache key hashes the same directory.
 */
function clarinetBuildHash(): string {
  const hash = createHash("sha256");
  for (const file of fs.readdirSync(DOCKER_DIR).sort()) {
    hash.update(file).update(fs.readFileSync(path.join(DOCKER_DIR, file)));
  }
  return hash.digest("hex").slice(0, 16);
}

const CACHE_DIR = path.join(PACKAGE_ROOT, ".clarinet-cache", clarinetBuildHash());
const CACHED_BINARY = path.join(CACHE_DIR, "clarinet");
// Clarinet's own output when `DEBUG` is unset: kept on disk (not in `.clarinet-cache/`, which CI
// uploads as a cache) so a boot failure can still print it -- see `dumpBootDiagnostics`.
const CLARINET_LOG = path.join(os.tmpdir(), "coin-tester-stacks-clarinet.log");

/**
 * Produces a patched `clarinet` binary (see `docker/clarinet/Dockerfile` for what each patch fixes)
 * and returns its path, building/caching it on first use only.
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
 *   host at all), it's built with a local `cargo +<RUST_TOOLCHAIN>` instead -- requires `rustup`;
 *   there is no way around a host-matching compile here.
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
      // Prepared in a scratch directory and only renamed to `src` once cloned, checked out and
      // fully patched, so an existing `src` always is the pinned, patched tree: a clone or patch
      // that fails halfway leaves only `src.partial`, which the next attempt starts over from.
      const partialDir = `${sourceDir}.partial`;
      fs.rmSync(partialDir, { recursive: true, force: true });
      const clone = spawnSync(
        "git",
        ["clone", "https://github.com/stx-labs/clarinet.git", partialDir],
        { stdio: "inherit" },
      );
      if (clone.status !== 0) {
        throw new Error("coin-tester-stacks: failed to clone stx-labs/clarinet");
      }
      const checkout = spawnSync("git", ["checkout", readDockerfileArg("CLARINET_COMMIT")], {
        cwd: partialDir,
        stdio: "inherit",
      });
      if (checkout.status !== 0) {
        throw new Error("coin-tester-stacks: failed to check out the pinned clarinet commit");
      }
      for (const patch of CLARINET_PATCHES) {
        const apply = spawnSync("git", ["apply", path.join(DOCKER_DIR, patch)], {
          cwd: partialDir,
          stdio: "inherit",
        });
        if (apply.status !== 0) {
          throw new Error(`coin-tester-stacks: failed to apply ${patch}`);
        }
      }
      fs.renameSync(partialDir, sourceDir);
    }

    const RUST_TOOLCHAIN = readDockerfileArg("RUST_TOOLCHAIN");
    // `rustup` installs the pinned toolchain on first use if it's missing; a no-op afterwards.
    spawnSync("rustup", ["toolchain", "install", RUST_TOOLCHAIN, "--profile", "minimal"], {
      stdio: "inherit",
    });
    const build = spawnSync(
      "cargo",
      [`+${RUST_TOOLCHAIN}`, "build", "--release", "-p", "clarinet-cli"],
      {
        cwd: sourceDir,
        stdio: "inherit",
      },
    );
    if (build.status !== 0) {
      throw new Error(
        "coin-tester-stacks: failed to build clarinet-cli locally -- requires `rustup` with the " +
          `\`${RUST_TOOLCHAIN}\` toolchain installed (\`rustup toolchain install ${RUST_TOOLCHAIN}\`)`,
      );
    }
    fs.copyFileSync(path.join(sourceDir, "target", "release", "clarinet"), CACHED_BINARY);
  }

  fs.chmodSync(CACHED_BINARY, 0o755);
  return CACHED_BINARY;
}

let clarinetProcess: ChildProcess | null = null;

async function waitUntilReady(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // `clarinet` gives up on its own internal boot sequence (e.g. bitcoind never becoming
    // reachable) well before this function's own timeout and exits -- polling stacks-api for the
    // remaining budget at that point is pure wasted CI time against a process that no longer
    // exists. Fail fast instead, with a distinct message so this isn't confused with "still
    // booting, just slow".
    if (
      clarinetProcess &&
      (clarinetProcess.exitCode !== null || clarinetProcess.signalCode !== null)
    ) {
      throw new Error(
        `coin-tester-stacks: clarinet process exited (code=${clarinetProcess.exitCode}, signal=${clarinetProcess.signalCode}) before the devnet became ready -- see the clarinet output above for the actual boot failure`,
      );
    }
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
 * Clarinet publishes this package's contracts (`Clarinet.toml`) through its deployment plan
 * (`deployments/default.devnet-plan.yaml`) once the devnet is up -- stacks-api reporting "ready"
 * only means the API/Postgres pair is up, not that the deployment transactions have been mined yet.
 * Poll the contract-interface endpoint (200 once the contract exists on-chain, 404 until then) so
 * scenario transactions never race a not-yet-deployed contract.
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
 * stacks-blockchain-api/Postgres pair) by running a patched `clarinet` binary (see
 * `ensureClarinetBinary`) directly on the host -- `clarinet` itself still talks to the local
 * Docker daemon to spawn/manage those sibling containers, exactly as it's designed to.
 *
 * The devnet boots from Clarinet's own chain-state snapshot, embedded in the binary, which starts
 * at burn height 163 (past epoch 4.0), so the scenarios never wait for the epoch 3.0/4.0
 * transitions. Clarinet only uses it when `settings/Devnet.toml` matches its defaults on the
 * snapshot's significant fields (epochs, signer keys, stacking orders); otherwise it falls back to
 * a genesis boot, which works but is ~10 minutes slower -- see the README.
 *
 * Blocks are mined by Clarinet itself: the stacks-node reaches bitcoind through Clarinet's Bitcoin
 * RPC proxy (`[burnchain].rpc_port` = Clarinet's ingestion port), and Clarinet mines the next block
 * each time it relays a miner's block-commit.
 */
export async function spawnDevnet(): Promise<void> {
  console.log("Starting Stacks Clarinet devnet (this can take a few minutes)…");

  // Defensive: a previous run that didn't exit cleanly (e.g. killed with `pkill` rather than
  // through `killDevnet`) can leave this devnet's containers/network running — verified this
  // happening for 27+ minutes, silently colliding with a later run on the same ports. Idempotent
  // if there's nothing to clean up.
  await killDevnet();

  const binary = ensureClarinetBinary();

  const clarinetOutput = process.env.DEBUG ? "inherit" : fs.openSync(CLARINET_LOG, "w");
  clarinetProcess = spawn(
    binary,
    ["integrate", "--no-dashboard", "--manifest-path", "Clarinet.toml"],
    {
      cwd: PACKAGE_ROOT,
      // stdin piped and pre-answered below: if `Devnet.toml` ever stops matching the snapshot,
      // Clarinet asks on stdin whether to continue without it. Answering "y" keeps the run going on
      // a (slower) genesis boot instead of blocking until the boot deadline.
      stdio: ["pipe", clarinetOutput, clarinetOutput],
    },
  );

  // Written repeatedly (not `.end()`-ed) in case more than one confirmation prompt appears in
  // sequence; harmless extra bytes if none do, since nothing else in this flow reads stdin.
  clarinetProcess.stdin?.write("y\n".repeat(5));

  clarinetProcess.on("error", err => {
    console.error(chalk.red("coin-tester-stacks: failed to spawn clarinet"), err);
  });

  // A snapshot boot is ready in about a minute, in CI too (the first run on a runner also pulls
  // the devnet images). 5 minutes leaves margin without letting a broken boot hold CI for long.
  const bootDeadline = Date.now() + 5 * 60 * 1000;

  try {
    await waitUntilReady(bootDeadline - Date.now());
  } catch (error) {
    await dumpBootDiagnostics();
    throw error;
  }
  console.log(chalk.bgBlueBright(" -  STACKS DEVNET READY ✅  - "));
}

/**
 * Prints why the devnet failed to boot, without needing `DEBUG`: the tail of Clarinet's own output
 * and, for every container on the devnet network, its exit state and last log lines. Runs before
 * `killDevnet` removes the containers. In CI this is the only place the actual cause shows up.
 */
async function dumpBootDiagnostics(): Promise<void> {
  if (!process.env.DEBUG && fs.existsSync(CLARINET_LOG)) {
    const lines = fs.readFileSync(CLARINET_LOG, "utf8").trimEnd().split("\n");
    console.log(`[boot diagnostic] last clarinet output:\n${lines.slice(-80).join("\n")}`);
  }
  await dumpContainerDiagnostics("boot diagnostic");
}

async function dumpContainerDiagnostics(label: string): Promise<void> {
  const containerIds = await execAsync(`docker ps -aq --filter "network=${DEVNET_NETWORK_NAME}"`);
  if (!containerIds) {
    console.log(`[${label}] no container on ${DEVNET_NETWORK_NAME}`);
    return;
  }
  for (const id of containerIds.split("\n")) {
    const info = await execAsync(
      `docker inspect ${id} --format '{{.Name}} status={{.State.Status}} exitCode={{.State.ExitCode}} error={{.State.Error}}'`,
    );
    console.log(`[${label}] ${info}`);
    const logs = await execAsync(`docker logs --tail 50 ${id} 2>&1`);
    console.log(`[${label}] logs for ${id}:\n${logs}`);
  }
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
  clarinetProcess?.kill("SIGTERM");
  clarinetProcess = null;

  const containerIds = await execAsync(`docker ps -aq --filter "network=${DEVNET_NETWORK_NAME}"`);
  if (containerIds) {
    // Containers are force-removed right below, so this is the last chance to see their exit
    // state and logs (clarinet's own `auto_remove` is disabled for the same reason, see
    // `bitcoin-node-no-autoremove.patch`). A boot failure already prints them without `DEBUG`
    // (`dumpBootDiagnostics`); this covers failures later in a scenario.
    if (process.env.DEBUG) {
      await dumpContainerDiagnostics("killDevnet diagnostic");
    }
    await execAsync(`docker rm -f ${containerIds.split("\n").join(" ")}`);
  }
  await execAsync(`docker network rm ${DEVNET_NETWORK_NAME}`);
}
