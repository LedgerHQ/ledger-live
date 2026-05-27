import chalk from "chalk";
import * as compose from "docker-compose";

export const LOTUS_RPC_URL = "http://127.0.0.1:1234/rpc/v1";

import path from "path";

const composeOptions = {
  cwd: path.resolve(__dirname, ".."),
  log: true,
  env: process.env,
};

/**
 * Calls the Lotus JSON-RPC v1 endpoint.
 * On a freshly started devnet the daemon JWT is not required for most calls.
 * For state-mutating calls (MpoolPushMessage) we read the admin token from the
 * container and pass it as a Bearer token.
 */
async function lotusRpc<T>(
  method: string,
  params: unknown[],
  authToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(LOTUS_RPC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const json = (await response.json()) as { result?: T; error?: { message: string } };

  if (json.error) {
    throw new Error(`Lotus RPC error (${method}): ${json.error.message}`);
  }

  return json.result as T;
}

/**
 * Reads the admin JWT token from the running Lotus container.
 * The token is stored at /var/lib/lotus/token inside the container.
 */
export async function readAdminToken(): Promise<string> {
  const result = await compose.exec("lotus", "cat /var/lib/lotus/token", composeOptions);
  return result.out.trim();
}

/**
 * Polls the Lotus RPC until ChainHead returns a valid response.
 * Called after `docker compose up --wait` to confirm the node is truly ready
 * to accept transactions (not just passing the Docker healthcheck).
 */
async function waitForMinerProducingBlocks(timeoutMs = 300_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let firstHeight: number | null = null;

  while (Date.now() < deadline) {
    try {
      const head = await lotusRpc<{ Height: number }>("Filecoin.ChainHead", []);
      if (head?.Height !== undefined) {
        if (firstHeight === null) {
          firstHeight = head.Height;
          console.log(`Lotus daemon responding — height: ${firstHeight}. Waiting for miner to produce blocks...`);
        } else if (head.Height > firstHeight) {
          console.log(`Miner producing blocks — height progressed from ${firstHeight} to ${head.Height}`);
          return;
        }
      }
    } catch {
      // Node not ready yet — keep polling
    }
    await new Promise(resolve => setTimeout(resolve, 2_000));
  }

  throw new Error(
    `Lotus miner did not start producing blocks within ${timeoutMs / 1_000} s.`,
  );
}

export async function spawnLotus(): Promise<void> {
  console.log("Starting Filecoin Lotus devnet...");
  await compose.upOne("lotus", {
    ...composeOptions,
    commandOptions: ["--wait"],
  });
  await waitForMinerProducingBlocks();
  console.log(chalk.bgBlueBright(" -  LOTUS READY ✅  - "));
}

export async function killLotus(): Promise<void> {
  console.log("Stopping Filecoin Lotus devnet...");
  await compose.down({
    ...composeOptions,
    commandOptions: ["--remove-orphans"],
    // Do NOT use --volumes: we keep the lotus-params volume cached
    // to avoid re-downloading ~1.2 GB of proof parameters on each run.
  });
}

/**
 * Returns the default wallet address held by the Lotus devnet miner.
 * Used as the funding source for test accounts.
 */
async function getDefaultWallet(authToken: string): Promise<string> {
  return lotusRpc<string>("Filecoin.WalletDefaultAddress", [], authToken);
}

/**
 * Funds a test account by sending FIL from the Lotus default wallet using
 * `Filecoin.MpoolPushMessage`. The devnet miner starts with a pre-funded wallet
 * so this succeeds as long as the node has mined at least one block.
 *
 * Returns the CID of the message that was pushed to the mempool.
 */
/** Convert mainnet 'f' prefix to testnet 't' prefix for the Lotus devnet */
function toTestnetAddr(addr: string): string {
  return addr.startsWith("f") ? "t" + addr.slice(1) : addr;
}

export async function fundAccount(
  address: string,
  amountAttoFil: string,
): Promise<{ cid: string }> {
  const authToken = await readAdminToken();
  const from = await getDefaultWallet(authToken);
  // Convert f-prefix to t-prefix for the devnet
  const toAddr = toTestnetAddr(address);

  // GasLimit 0 means auto-estimate; GasFeeCap / GasPremium "" means auto
  const response = await lotusRpc<{
    CID: { "/": string };
    Message: { Nonce: number };
  }>(
    "Filecoin.MpoolPushMessage",
    [
      {
        Version: 0,
        To: toAddr,
        From: from,
        Nonce: 0,
        Value: amountAttoFil,
        GasLimit: 0,
        GasFeeCap: "0",
        GasPremium: "0",
        Method: 0,
        Params: "",
      },
      {
        MaxFee: "100000000000000000", // 0.1 FIL max fee
      },
    ],
    authToken,
  );

  const cid = response?.CID?.["/"];
  if (!cid) throw new Error(`MpoolPushMessage returned unexpected result: ${JSON.stringify(response)}`);

  console.log(`Funded ${address} with ${amountAttoFil} attoFIL — CID: ${cid}`);
  return { cid };
}

/**
 * Polls the Lotus node until the message with the given CID has been included
 * in a block (state becomes non-null). Used by the scenario's `mockIndexer`
 * hook so the coin-tester framework only runs assertions once the tx is on-chain.
 */
export async function waitForMessageInclusion(
  cid: string,
  timeoutMs = 120_000,
): Promise<void> {
  const authToken = await readAdminToken();

  // StateWaitMsg blocks until the message is included with the given confidence (1 epoch).
  // Limit = 0 means unlimited lookback. AllowReplacement = true handles gas bumps.
  const result = await Promise.race([
    lotusRpc<{ Receipt: { ExitCode: number }; Height: number } | null>(
      "Filecoin.StateWaitMsg",
      [{ "/": cid }, 1, 0, true],
      authToken,
    ),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Message ${cid} was not included within ${timeoutMs / 1_000} s`)), timeoutMs),
    ),
  ]);

  if (result && result.Receipt.ExitCode !== 0) {
    throw new Error(`Message ${cid} failed with ExitCode ${result.Receipt.ExitCode}`);
  }

  console.log(`Message ${cid} included at height ${result?.Height}`);
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killLotus();
  }),
);
