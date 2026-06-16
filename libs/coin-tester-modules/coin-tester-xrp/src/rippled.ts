import path from "path";
import chalk from "chalk";
import * as compose from "docker-compose";
import { encode } from "ripple-binary-codec";
import { deriveAddress, deriveKeypair, sign } from "ripple-keypairs";
import { XRP_LOCAL_RPC, GENESIS_SEED } from "./fixtures";

const PACKAGE_ROOT = path.resolve(__dirname, "..");

const composeOpts = () => ({
  cwd: PACKAGE_ROOT,
  log: Boolean(process.env.DEBUG),
  env: process.env,
});

type RpcResponse<T> = { result: T & { status?: string; error?: string; error_message?: string } };

async function rpcCall<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(XRP_LOCAL_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: [params] }),
  });
  if (!res.ok) throw new Error(`rippled ${method} → HTTP ${res.status}`);
  const body = (await res.json()) as RpcResponse<T>;
  if (body.result.status === "error") {
    throw new Error(`rippled ${method} → ${body.result.error_message ?? body.result.error}`);
  }
  return body.result;
}

export async function spawnRippled(): Promise<void> {
  console.log("Starting rippled (standalone)…");
  // The container's healthcheck (see docker-compose.yml) only reports
  // healthy once `server_state` is one of the ready states, so by the
  // time `--wait` returns rippled is fully primed.
  await compose.upOne("rippled", { ...composeOpts(), commandOptions: ["--wait"] });
  console.log(chalk.bgBlueBright(" -  RIPPLED READY ✅  - "));
}

export async function killRippled(): Promise<void> {
  console.log("Stopping rippled…");
  await compose.down({ ...composeOpts(), commandOptions: ["--remove-orphans", "--volumes"] });
}

export async function closeLedger(): Promise<number> {
  const res = await rpcCall<{ ledger_current_index: number }>("ledger_accept");
  return res.ledger_current_index;
}

export async function getCurrentLedgerIndex(): Promise<number> {
  const res = await rpcCall<{ ledger_current_index: number }>("ledger_current");
  return res.ledger_current_index;
}

async function getNextSequence(address: string): Promise<number> {
  const res = await rpcCall<{ account_data: { Sequence: number } }>("account_info", {
    account: address,
    ledger_index: "current",
  });
  return res.account_data.Sequence;
}

/**
 * Funds `address` with `xrpAmount` XRP by sending a Payment from the genesis
 * "masterpassphrase" account, then closes the ledger so the recipient is
 * spendable in subsequent ledger queries.
 */
export async function fundAccount(address: string, xrpAmount: number): Promise<string> {
  const { publicKey, privateKey } = deriveKeypair(GENESIS_SEED);
  const senderAddress = deriveAddress(publicKey);
  const sequence = await getNextSequence(senderAddress);
  const currentLedger = await getCurrentLedgerIndex();

  const tx = {
    TransactionType: "Payment" as const,
    Account: senderAddress,
    Destination: address,
    Amount: String(Math.trunc(xrpAmount * 1_000_000)),
    Fee: "10",
    Flags: 2147483648,
    Sequence: sequence,
    LastLedgerSequence: currentLedger + 20,
    SigningPubKey: publicKey,
  };

  const encoded = encode(tx);
  const signature = sign("53545800" + encoded, privateKey);
  const signedBlob = encode({ ...tx, TxnSignature: signature });

  const submit = await rpcCall<{
    engine_result: string;
    engine_result_message: string;
    tx_json: { hash: string };
  }>("submit", { tx_blob: signedBlob });

  if (submit.engine_result !== "tesSUCCESS" && submit.engine_result !== "terQUEUED") {
    throw new Error(`Funding payment rejected: ${submit.engine_result_message}`);
  }

  await waitForOperationInclusion(submit.tx_json.hash);
  return submit.tx_json.hash;
}

/**
 * Validates a pending submission in one shot: `ledger_accept` blocks until
 * the open ledger is closed and every queued tx is validated, after which
 * a single `tx` lookup is enough to read the result.
 */
export async function waitForOperationInclusion(hash: string): Promise<void> {
  await closeLedger();
  const res = await rpcCall<{ validated?: boolean; meta?: { TransactionResult: string } }>("tx", {
    transaction: hash,
    binary: false,
  });
  if (!res.validated) {
    throw new Error(`tx ${hash} was not validated after ledger_accept`);
  }
  if (res.meta && res.meta.TransactionResult !== "tesSUCCESS") {
    throw new Error(`tx ${hash} failed on-chain: ${res.meta.TransactionResult}`);
  }
}
