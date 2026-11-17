import { Observable } from "rxjs";
import { ApduResponse, DeviceActionStatus } from "@ledgerhq/device-management-kit";
import type {
  DeviceAction,
  DeviceActionIntermediateValue,
  DeviceManagementKit,
  DmkError,
  ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import { _setTestDmkTransport } from "../device/register-dmk-transport";
import { MockDeviceManagementKit } from "../device/mock-dmk";
import { WalletCliDmkTransport } from "../device/wallet-cli-dmk-transport";
import type { EthTxStatus } from "../wallet/earn/api.types";
import { _setTestEarnPollSleep } from "../wallet/earn/eth-vault-transactions";
import { MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "./constants";
import { ETH_SYNC_ROUTES } from "./eth-sync-routes";
import { runCli } from "./cli-runner";
import type { RunResult } from "./cli-runner";
import { MockServer } from "./mock-server";
import type { Route } from "./mock-server";
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
 * the next of `hashes`, a signing device, and tx status polls that don't wait (recorded in `sleeps`).
 * `resetTestSeams()` unplugs the device and restores the poll wait.
 */
export class SignedEvmEarn {
  readonly api = new FakeEarnApi();
  readonly node: FakeEvmNode;
  readonly device = new SigningDevice();
  readonly sleeps: number[] = [];
  private readonly server: MockServer;

  constructor(hashes: string[]) {
    this.node = new FakeEvmNode(hashes);
    this.server = new MockServer([...this.node.routes, ...this.api.routes]);
  }

  /** Starts the server and plugs the device in; returns the env for `runEarn`. */
  start(): Record<string, string> {
    this.device.plugIn();
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

/**
 * The device agent's Solana node, also taking signed txs: `sendTransaction` records each (base64)
 * and answers `signature`, and `getSignatureStatuses` reports it confirmed.
 */
export class FakeStakingSolanaNode {
  readonly rpc: FakeSolanaRpc;
  readonly sent: string[] = [];
  /** What the node answers to `sendTransaction`: the tx signature, base58. */
  signature = base58Encode(SOLANA_SIGNATURE);

  constructor(owner: string) {
    this.rpc = new FakeSolanaRpc(owner);
  }

  get routes(): Route[] {
    const [node, ...services] = this.rpc.routes;
    return [
      {
        ...node,
        onRequest: async request => {
          const text = await request.text();
          const call = JSON.parse(text) as RpcCall | RpcCall[];
          const result = Array.isArray(call) ? undefined : this.broadcastResult(call);
          if (result === undefined) {
            return node.onRequest?.(new Request(request.url, { method: "POST", body: text }));
          }
          return Response.json({ jsonrpc: "2.0", id: (call as RpcCall).id, result });
        },
      },
      ...services,
    ];
  }

  private broadcastResult({ method, params }: RpcCall): unknown {
    if (method === "sendTransaction") {
      this.sent.push(String(params?.[0]));
      return this.signature;
    }
    if (method === "getSignatureStatuses") {
      const status = { slot: 1, confirmations: null, err: null, confirmationStatus: "confirmed" };
      return { context: { slot: 1 }, value: [status] };
    }
    return undefined;
  }
}

type RpcCall = { id: unknown; method: string; params?: unknown[] };

export const SOLANA_OWNER = "4pKFxpCN3k97FW5TUNYpJrCXNvGBu4aYGqPESkzi3tmR";
export const SOLANA_VALIDATOR = "CertusDeBmqN8ZawdkxK5kFGMwBXdudvWHYwtNgNhvLu";
export const SOLANA_STAKE = "7ewp1mzKTRtGWa3aHqy8bXJ3p9gdGxXaqzX7Jq3WbpGa";
export const SOLANA_ACCOUNT = {
  label: "solana-1",
  descriptor: `account:2:address:solana:${SOLANA_OWNER}:m/44h/501h/0h/0h`,
};

/**
 * A Solana earn run signed on the device: the node knows `SOLANA_VALIDATOR` and an active stake
 * (`SOLANA_STAKE`) delegated to it. `resetTestSeams()` unplugs the device.
 */
export class SignedSolanaEarn {
  readonly node = new FakeStakingSolanaNode(SOLANA_OWNER);
  readonly device = new SigningDevice(SOLANA_OWNER);
  private readonly server = new MockServer(this.node.routes);

  constructor() {
    this.node.rpc.validators = [SOLANA_VALIDATOR];
    this.node.rpc.stakeAccounts = [
      { address: SOLANA_STAKE, lamports: 2_000_000_000, validator: SOLANA_VALIDATOR },
    ];
  }

  /** Starts the server and plugs the device in; returns the env for `runEarn`. */
  start(): Record<string, string> {
    this.device.plugIn();
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

// Any point on secp256k1 does: nothing checks the recovered sender.
const SIGNATURE = {
  r: "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
  s: `0x${"22".repeat(32)}`,
  v: 37,
};

const REFUSED = { _tag: "EthAppCommandError", errorCode: "6985", message: "Denied by user" };

/** What a ConnectApp device action asked for. */
export type ConnectAppInput = {
  application: { name: string };
  dependencies?: { name: string }[];
  unlockTimeout?: number;
};

const SOLANA_GET_PUBKEY = 0x05;
const SOLANA_SIGN = 0x06;
const SOLANA_P2_MORE = 0x02;
const OK = new Uint8Array([0x90, 0x00]);
const DENIED = new Uint8Array([0x69, 0x85]);
const SOLANA_SIGNATURE = new Uint8Array(64).fill(0x11);

/**
 * A connected device that signs every transaction, or refuses them all, recording what the CLI
 * opened and signed: the Ethereum app through DMK actions, the Solana app (for `solanaAddress`)
 * through APDUs.
 */
export class SigningDevice extends MockDeviceManagementKit {
  readonly openedApps: ConnectAppInput[] = [];
  signed = 0;
  refuse = false;

  constructor(private readonly solanaAddress?: string) {
    super({ appResults: { Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS } } });
  }

  override sendApdu(args: { sessionId?: string; apdu: Uint8Array; abortTimeout?: number }) {
    const [, ins, , p2] = args.apdu;
    if (this.solanaAddress === undefined) return super.sendApdu(args);
    if (ins === SOLANA_GET_PUBKEY) return answer(base58Decode(this.solanaAddress), OK);
    if (ins !== SOLANA_SIGN) return super.sendApdu(args);
    // The message comes in chunks; only the last one, without P2_MORE, gets the signature.
    if (p2 & SOLANA_P2_MORE) return answer(new Uint8Array(0), OK);
    this.signed += 1;
    return this.refuse ? answer(new Uint8Array(0), DENIED) : answer(SOLANA_SIGNATURE, OK);
  }

  override executeDeviceAction<
    Output,
    Err extends DmkError,
    IntermediateValue extends DeviceActionIntermediateValue,
    Input,
  >(args: {
    sessionId: string;
    deviceAction: DeviceAction<Output, Input, Err, IntermediateValue>;
  }): ExecuteDeviceActionReturnType<Output, Err, IntermediateValue> {
    const input = args.deviceAction.input as Record<string, unknown>;
    if (input.application !== undefined) this.openedApps.push(input as ConnectAppInput);
    if (!(input.transaction instanceof Uint8Array)) return super.executeDeviceAction(args);
    this.signed += 1;
    const state = this.refuse
      ? { status: DeviceActionStatus.Error, error: REFUSED as unknown as Err }
      : { status: DeviceActionStatus.Completed, output: SIGNATURE as Output };
    const observable = new Observable<typeof state>(subscriber => {
      subscriber.next(state);
      subscriber.complete();
    });
    return { observable, cancel: () => {} } as unknown as ExecuteDeviceActionReturnType<
      Output,
      Err,
      IntermediateValue
    >;
  }

  /** Plugs this device in for the next CLI runs; `resetTestSeams()` unplugs it. */
  plugIn(): void {
    _setTestDmkTransport(
      new WalletCliDmkTransport(this as unknown as DeviceManagementKit, "mock-session-id"),
    );
  }
}

function answer(data: Uint8Array, statusCode: Uint8Array): Promise<ApduResponse> {
  return Promise.resolve(new ApduResponse({ statusCode, data }));
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Uint8Array): string {
  let value = bytes.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n);
  let text = "";
  while (value > 0n) {
    text = BASE58[Number(value % 58n)] + text;
    value /= 58n;
  }
  return text;
}

/** The 32 bytes a Solana address encodes. */
function base58Decode(address: string): Uint8Array {
  let value = 0n;
  for (const char of address) value = value * 58n + BigInt(BASE58.indexOf(char));
  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i -= 1) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return bytes;
}
