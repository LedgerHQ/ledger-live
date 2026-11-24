import BigNumber from "bignumber.js";
import { encode, encodeForSigning } from "ripple-binary-codec";
import { sign } from "ripple-keypairs";
import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { sandboxVersions } from "@ledgerhq/coin-tester/versions";
import type { XrplWallet } from "./signer";

// The RPC of the coin-sandbox instance, known once it is up
let rpcUrl: string | undefined;

type RpcResponse<T> = { result: T & { status?: string; error?: string; error_message?: string } };

type TxMeta = { TransactionResult: string; [field: string]: unknown };

/** A trust line from the holder's side, as `account_lines` returns it */
type TrustLine = { balance: string; limit: string; no_ripple?: boolean; freeze?: boolean };

/** `MPTAmount` is omitted at 0 */
type MpToken = { MPTokenIssuanceID: string; MPTAmount?: string; Flags: number };

export function getXrpRpc(): string {
  if (rpcUrl === undefined) throw new Error("the XRP RPC is not set: is the sandbox up?");

  return rpcUrl;
}

export async function startXrpSandbox(): Promise<Sandbox> {
  const sandbox = await startSandbox(
    { family: "xrp", network: "ripple" },
    sandboxVersions("ripple"),
  );
  const rpc = sandbox.endpoints.node;
  if (rpc === undefined) throw new Error("the sandbox instance has no node endpoint");

  rpcUrl = rpc;
  return sandbox;
}

async function rpcCall<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(getXrpRpc(), {
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

export async function closeLedger(): Promise<number> {
  const res = await rpcCall<{ ledger_current_index: number }>("ledger_accept");
  return res.ledger_current_index;
}

/**
 * Validates a pending submission in one shot: `ledger_accept` blocks until
 * the open ledger is closed and every queued tx is validated, after which
 * a single `tx` lookup is enough to read the result.
 */
export async function waitForOperationInclusion(hash: string): Promise<TxMeta> {
  await closeLedger();
  const res = await rpcCall<{ validated?: boolean; meta?: TxMeta }>("tx", {
    transaction: hash,
    binary: false,
  });
  if (!res.validated || !res.meta) {
    throw new Error(`tx ${hash} was not validated after ledger_accept`);
  }
  if (res.meta.TransactionResult !== "tesSUCCESS") {
    throw new Error(`tx ${hash} failed on-chain: ${res.meta.TransactionResult}`);
  }

  return res.meta;
}

function getTransaction(hash: string) {
  return rpcCall<{ Flags?: number; SendMax?: { value: string } }>("tx", {
    transaction: hash,
    binary: false,
  });
}

/** The `Flags` of a validated transaction, without tfFullyCanonicalSig (0x80000000), a signing detail */
export async function getTransactionFlags(hash: string): Promise<number> {
  const { Flags } = await getTransaction(hash);

  return (Flags ?? 0) & 0x7fffffff;
}

export async function getSendMaxValue(hash: string): Promise<string | undefined> {
  const { SendMax } = await getTransaction(hash);

  return SendMax?.value;
}

async function getNextSequence(address: string): Promise<number> {
  const res = await rpcCall<{ account_data: { Sequence: number } }>("account_info", {
    account: address,
    ledger_index: "current",
  });

  return res.account_data.Sequence;
}

export async function signAndSubmit(
  wallet: XrplWallet,
  tx: Record<string, unknown>,
): Promise<TxMeta> {
  const sequence = await getNextSequence(wallet.address);
  const filled = {
    Fee: "10",
    Flags: 0,
    ...tx,
    Account: wallet.address,
    Sequence: sequence,
    SigningPubKey: wallet.publicKey,
  };
  const signature = sign(encodeForSigning(filled), wallet.privateKey);

  const submit = await rpcCall<{
    engine_result: string;
    engine_result_message: string;
    tx_json: { hash: string };
  }>("submit", { tx_blob: encode({ ...filled, TxnSignature: signature }) });
  if (submit.engine_result !== "tesSUCCESS") {
    throw new Error(
      `${String(tx.TransactionType)} rejected: ${submit.engine_result} ${submit.engine_result_message}`,
    );
  }

  return waitForOperationInclusion(submit.tx_json.hash);
}

export async function getTrustLine(
  holder: string,
  issuer: string,
  currency: string,
): Promise<TrustLine | undefined> {
  const res = await rpcCall<{ lines: (TrustLine & { currency: string })[] }>("account_lines", {
    account: holder,
    peer: issuer,
    ledger_index: "validated",
  });

  return res.lines.find(line => line.currency === currency);
}

export async function getMpToken(holder: string, issuanceId: string): Promise<MpToken | undefined> {
  const res = await rpcCall<{ account_objects: MpToken[] }>("account_objects", {
    account: holder,
    type: "mptoken",
    ledger_index: "validated",
  });

  return res.account_objects.find(object => object.MPTokenIssuanceID === issuanceId);
}

/** The reserve each owned ledger entry (a trust line, an `MPToken`) locks, in drops. */
export async function getOwnerReserveIncrement(): Promise<BigNumber> {
  const res = await rpcCall<{ info: { validated_ledger: { reserve_inc_xrp: number } } }>(
    "server_info",
  );

  return new BigNumber(res.info.validated_ledger.reserve_inc_xrp).shiftedBy(6);
}
