import type { EthTxStatus } from "../wallet/earn/api.types";
import { _setTestEarnPollSleep } from "../wallet/earn/eth-vault-transactions";
import { MOCK_ETH_ADDRESS } from "./constants";
import { ETH_SYNC_ROUTES } from "./eth-sync-routes";
import { runCli } from "./cli-runner";
import type { RunResult } from "./cli-runner";
import { MockServer } from "./mock-server";
import type { Route } from "./mock-server";
import { base58Decode, FAKE_LEDGER_SOLANA_SIGNATURE, FakeLedger } from "./fake-ledger";
import { FakeSolanaRpc } from "./fake-solana-rpc";
import { makeSessionDir } from "./session-fixture";

/** One Kiln ERC-4626 vault, as GET /v1/defi/products lists it. */
export const VAULT = {
  id: "usdc-vault",
  chain: "eth",
  chain_id: 1,
  address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  vault: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  asset: "0xcccccccccccccccccccccccccccccccccccccccc",
  asset_symbol: "USDC",
  asset_decimals: 6,
};

/** Backend-built calldata calling `to` from the mock account. */
export function vaultTx(to: string, data: string) {
  return {
    wallet: MOCK_ETH_ADDRESS,
    to,
    data,
    value: "0",
    nonce: 0,
    gas_limit: 300_000,
    chain_id: 1,
  };
}

/** A tx status poll answer: a status, an HTTP error code, or a connection refused. */
export type StatusStep = EthTxStatus | 400 | 500 | "refused";

/**
 * The earn backend's /v1/defi routes. Each tx hash answers its status polls from its own script,
 * repeating the last step once the script runs out.
 */
export class FakeEarnApi {
  /** `null` answers 204: the allowance already covers the deposit. */
  approve: ReturnType<typeof vaultTx> | null = vaultTx(VAULT.asset, "0x095ea7b3");
  deposit = vaultTx(VAULT.vault, "0x6e553f65");
  withdraw = vaultTx(VAULT.vault, "0xba087652");
  readonly statuses: Record<string, StatusStep[]> = {};
  /** `POST` paths with their JSON body, in order. */
  readonly posts: { path: string; body: Record<string, unknown> }[] = [];
  /** Hash of each status poll, in order. */
  readonly polls: string[] = [];

  get routes(): Route[] {
    return [
      { method: "GET", match: "/v1/defi/products", response: [VAULT] },
      this.post("/v1/defi/approve", () => this.approve),
      this.post("/v1/defi/deposit", () => this.deposit),
      this.post("/v1/defi/withdraw", () => this.withdraw),
      {
        method: "GET",
        match: "/v1/defi/eth/transaction/status",
        response: null,
        onRequest: request => {
          const hash = new URL(request.url).searchParams.get("tx_hash") ?? "";
          const script = this.statuses[hash] ?? ["success"];
          const step =
            script[Math.min(this.polls.filter(h => h === hash).length, script.length - 1)];
          this.polls.push(hash);
          return statusResponse(step);
        },
      },
    ];
  }

  private post(path: string, tx: () => ReturnType<typeof vaultTx> | null): Route {
    return {
      method: "POST",
      match: path,
      response: null,
      onRequest: async request => {
        this.posts.push({ path, body: (await request.json()) as Record<string, unknown> });
        const data = tx();
        return data ? Response.json({ data }) : new Response(null, { status: 204 });
      },
    };
  }
}

function statusResponse(step: StatusStep): Response {
  // Nothing listens on port 1, so following the redirect fails like a network outage.
  if (step === "refused") return Response.redirect("http://127.0.0.1:1/");
  if (typeof step === "number") return new Response("status error", { status: step });
  return Response.json({ data: { status: step } });
}

/**
 * The Ethereum explorer: what sync and prepare read (1 ETH for gas), and a broadcast endpoint that
 * records each signed tx and answers with the next of `hashes`.
 */
export class FakeEvmNode {
  /** Signed txs as broadcast, in order. */
  readonly broadcasts: string[] = [];

  constructor(private readonly hashes: string[]) {}

  get routes(): Route[] {
    return [
      {
        method: "GET",
        match: /\/address\/[^/]+\/balance$/,
        response: { balance: "1000000000000000000" },
      },
      ...ETH_SYNC_ROUTES,
      {
        method: "GET",
        match: /\/address\/[^/]+\/nonce$/,
        response: { address: MOCK_ETH_ADDRESS, nonce: 0 },
      },
      {
        method: "POST",
        match: /\/tx\/estimate-gas-limit/,
        response: { estimated_gas_limit: "21000" },
      },
      {
        method: "GET",
        match: /\/gastracker\/barometer/,
        response: { low: "1", medium: "2", high: "3", next_base: "1" },
      },
      // Not broadcast yet: the explorer knows no hash for it.
      { method: "GET", match: /\/tx\/0x[0-9a-f]{64}$/, response: { transfer_events: [] } },
      {
        method: "POST",
        match: "/tx/send",
        response: null,
        onRequest: async request => {
          this.broadcasts.push(((await request.json()) as { tx: string }).tx);
          return Response.json({ result: this.hashes[this.broadcasts.length - 1] });
        },
      },
    ];
  }
}

/**
 * An EVM earn run signed on the device: the earn backend, the explorer answering each broadcast with
 * the next of `hashes`, a Ledger, and tx status polls that don't wait (recorded in `sleeps`).
 * `resetTestSeams()` unplugs the Ledger and restores the poll wait.
 */
export class SignedEvmEarn {
  readonly api = new FakeEarnApi();
  readonly node: FakeEvmNode;
  readonly device = new FakeLedger();
  readonly sleeps: number[] = [];
  private readonly server: MockServer;

  constructor(hashes: string[]) {
    this.node = new FakeEvmNode(hashes);
    this.server = new MockServer([...this.node.routes, ...this.api.routes]);
  }

  /** Starts the server and plugs the Ledger in; returns the env for `runEarn`. */
  start(): Record<string, string> {
    this.device.install();
    _setTestEarnPollSleep(ms => {
      this.sleeps.push(ms);
      return Promise.resolve();
    });
    this.server.start();
    return { WALLET_CLI_MOCK_PORT: String(this.server.port) };
  }

  stop(): void {
    this.server.stop();
  }
}

export const SOLANA_OWNER = "4pKFxpCN3k97FW5TUNYpJrCXNvGBu4aYGqPESkzi3tmR";
export const SOLANA_VALIDATOR = "CertusDeBmqN8ZawdkxK5kFGMwBXdudvWHYwtNgNhvLu";
export const SOLANA_STAKE = "7ewp1mzKTRtGWa3aHqy8bXJ3p9gdGxXaqzX7Jq3WbpGa";
export const SOLANA_ACCOUNT = {
  label: "solana-1",
  descriptor: `account:2:address:solana:${SOLANA_OWNER}:m/44h/501h/0h/0h`,
};

/**
 * A Solana earn run signed on the device: the node knows `SOLANA_VALIDATOR` and an active stake
 * (`SOLANA_STAKE`) delegated to it, and answers a broadcast with the Ledger's signature.
 * `resetTestSeams()` unplugs the Ledger.
 */
export class SignedSolanaEarn {
  readonly node = new FakeSolanaRpc(SOLANA_OWNER);
  readonly device = new FakeLedger({ solanaAddress: SOLANA_OWNER });
  private readonly server = new MockServer(this.node.routes);

  constructor() {
    this.node.validators = [SOLANA_VALIDATOR];
    this.node.stakeAccounts = [
      { address: SOLANA_STAKE, lamports: 2_000_000_000, validator: SOLANA_VALIDATOR },
    ];
    this.node.broadcastSignature = FAKE_LEDGER_SOLANA_SIGNATURE;
  }

  /** Starts the server and plugs the Ledger in; returns the env for `runEarn`. */
  start(): Record<string, string> {
    this.device.install();
    this.server.start();
    return { WALLET_CLI_MOCK_PORT: String(this.server.port) };
  }

  stop(): void {
    this.server.stop();
  }
}

/** True when the signed Solana tx (`base64`) references `address`. */
export function references(base64: string, address: string): boolean {
  return Buffer.from(base64, "base64").includes(Buffer.from(base58Decode(address)));
}

export type EarnTx = { kind: string; status?: string; to?: string; hash?: string };
export type EarnEnvelope = Record<string, unknown> & {
  transactions?: EarnTx[];
  error?: { message: string; code?: string };
};

/** Every JSON line a run printed, device-state progress events included. */
export function jsonLines(stdout: string): EarnEnvelope[] {
  return stdout
    .split("\n")
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as EarnEnvelope);
}

/** The terminal envelopes: every JSON line but the device-state progress events. */
export function earnResults(stdout: string): EarnEnvelope[] {
  return jsonLines(stdout).filter(line => line.type === undefined);
}

/** Runs `earn <args…> --output <output>` with `account` as the only session entry. */
export async function runEarn(
  account: { label: string; descriptor: string },
  args: string[],
  env: Record<string, string>,
  output: "json" | "human" = "json",
): Promise<RunResult> {
  const fixture = makeSessionDir([account]);
  try {
    return await runCli(["earn", ...args, "--output", output], { ...env, ...fixture.env });
  } finally {
    fixture.cleanup();
  }
}

/** True when the signed tx `hex` calls `address`. */
export function calls(hex: string, address: string): boolean {
  return hex.includes(address.slice(2).toLowerCase());
}
