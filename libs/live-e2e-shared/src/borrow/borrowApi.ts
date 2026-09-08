import { Interface } from "ethers";
import type {
  BorrowAction,
  EvmSignablePayload,
  OpenLoan,
  PartnerActionResponse,
  PartnerActionStep,
} from "./types";

/** Staging only — the staging Borrow API is keyless (reads and actions). */
const BASE_URL = "https://global.api.stg.ledger-test.com/borrow";
const JSON_HEADERS = { "Content-Type": "application/json" };
const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 60;

/** This driver targets Ethereum mainnet only. */
export const ETHEREUM_NETWORK = "ethereum";
export const ETHEREUM_CHAIN_ID = 1;

/**
 * Default market for `open`: WBTC collateral, **USDT** debt. We always open USDT
 * loans (never USDC). Override with `--market-id` only for a deliberate exception.
 */
export const DEFAULT_MARKET_ID =
  "morpho-blue-borrow-ethereum-wbtc-usdt-0xa921ef34e2fc7a27ccc50ae7e4b154e16c9799d3387076c421423ef52ac4df99";

const ERC20 = new Interface(["function approve(address spender, uint256 value)"]);

function get(v: unknown, key: string): unknown {
  return v !== null && typeof v === "object" ? Reflect.get(v, key) : undefined;
}

function getString(v: unknown, key: string): string | undefined {
  const value = get(v, key);
  return typeof value === "string" ? value : undefined;
}

function post(pathname: string, body: unknown): Promise<Response> {
  return fetch(`${BASE_URL}${pathname}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

/**
 * The partner puts the actionable reason in the body, not the status line — a 412 on a repay
 * spells out which token is short and by how much. Losing it leaves a bare "412 Precondition
 * Failed" that says nothing about how to fix the account.
 */
async function failedRequest(pathname: string, res: Response): Promise<Error> {
  const detail = await res.text().catch(() => "");
  return new Error(
    `POST ${pathname} failed: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`,
  );
}

/**
 * `POST /v1/actions` body: `address`, `action`, and a freeform `args`.
 *
 * `args` verified on staging: `supply`/`borrow`/`withdraw` → `{ marketId, amount }`,
 * `repay` → `{ marketId, repayAll | amount }` (no `withdrawAll`). `marketId` is the
 * long per-market id from `/v1/positions` or a market's `collateral[].id`.
 */
export interface ActionRequest {
  address: string;
  action: BorrowAction;
  args: Record<string, unknown>;
}

function normalizeStep(raw: unknown, index: number): PartnerActionStep {
  const transactionId = getString(raw, "transactionId");
  const signablePayload = getString(raw, "signablePayload");
  const actionType = getString(raw, "actionType");
  if (!transactionId || !signablePayload || !actionType) {
    throw new Error(`Malformed partner step[${index}]: ${JSON.stringify(raw)}`);
  }
  return { transactionId, signablePayload, actionType: actionType.toLowerCase() };
}

/** `POST /v1/positions` — returns the raw `{ positions, errors, metadata }`. */
export async function getPositions(address: string): Promise<unknown> {
  const res = await post("/v1/positions", [{ network: ETHEREUM_NETWORK, address }]);
  if (!res.ok) throw await failedRequest("/v1/positions", res);
  return res.json();
}

/** Builds an action; returns `{ actionId, steps[] }`. Staging returns all steps upfront. */
export async function postAction(body: ActionRequest): Promise<PartnerActionResponse> {
  const res = await post("/v1/actions", body);
  if (!res.ok) throw await failedRequest("/v1/actions", res);
  const raw: unknown = await res.json();
  const actionId = getString(raw, "actionId");
  const steps = get(raw, "steps");
  if (!actionId) throw new Error(`Partner response missing actionId: ${JSON.stringify(raw)}`);
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error(`Partner returned no steps[] (actionId ${actionId})`);
  }
  return { actionId, steps: steps.map((step, i) => normalizeStep(step, i)) };
}

function parseStepPayload(step: PartnerActionStep, index: number): EvmSignablePayload {
  try {
    return JSON.parse(step.signablePayload);
  } catch {
    throw new Error(
      `Malformed signablePayload on partner step[${index}] (${step.actionType}): ${step.signablePayload}`,
    );
  }
}

/**
 * Address that needs an ERC-20 allowance to carry out `action`.
 *
 * The approve step is found by decoding calldata rather than by matching `step.actionType`,
 * because the spender is an argument of that calldata: one decode both identifies the step and
 * yields the value. `actionType` is an undocumented partner label — an open `string` with no
 * union and no other consumer — so it is reported on failure, not matched on.
 *
 * The partner omits the approve step entirely once the allowance already covers the amount, and
 * an earlier run can leave an unlimited one behind. Reading the spender only off that step would
 * therefore fail exactly when there is an allowance to revoke, so the target of the final step —
 * the contract that pulls the tokens, and so the spender — is the fallback.
 */
function requireAllowanceSpender(
  steps: PartnerActionStep[],
  action: BorrowAction,
  marketId: string,
): string {
  for (const [index, step] of steps.entries()) {
    const { data } = parseStepPayload(step, index);
    const approve = data ? ERC20.parseTransaction({ data }) : null;
    if (approve?.name === "approve") return String(approve.args.getValue("spender"));
  }
  const last = steps.at(-1);
  if (last) {
    const { to } = parseStepPayload(last, steps.length - 1);
    if (to) return to;
  }
  const actionTypes = steps.map(step => step.actionType).join(", ");
  throw new Error(
    `Partner ${action} for ${marketId} returned neither an ERC-20 approve step nor a step with a ` +
      `target to read the spender from (actionTypes: ${actionTypes})`,
  );
}

/**
 * Address the collateral allowance is granted to, read from the approve step the partner builds.
 * It is an adapter the partner can redeploy, so it is resolved rather than pinned. Building an
 * action does not broadcast anything.
 *
 * Posts `supplyAndBorrow`, which is what the borrow live app posts, **not** `supply`: the two
 * take different routes and so approve different spenders — `supply` grants Morpho Blue directly
 * (`0xBBBB…`) while `supplyAndBorrow` goes through a bundler (`0x38B0C1…`). Resolving from the
 * wrong one zeroes an allowance the UI never uses, and the approval step the spec drives then
 * silently stays unnecessary.
 */
export async function resolveCollateralSpender(
  address: string,
  collateralAmount: string,
  loanAmount: string,
  marketId: string = DEFAULT_MARKET_ID,
): Promise<string> {
  const { steps } = await postAction({
    address,
    action: "supplyAndBorrow",
    args: { marketId, amount: loanAmount, collateralAmount },
  });
  return requireAllowanceSpender(steps, "supplyAndBorrow", marketId);
}

/**
 * Same for the debt-token allowance a repay pulls through. `marketId` is the long id of the
 * position being repaid (not a market's `collateral[].id`), so an open loan with debt must
 * already exist — the partner has nothing to build a repay against otherwise.
 */
export async function resolveRepaySpender(address: string, marketId: string): Promise<string> {
  const { steps } = await postAction({
    address,
    action: "repay",
    args: { marketId, repayAll: true },
  });
  return requireAllowanceSpender(steps, "repay", marketId);
}

/** Best-effort notify; the state we act on is the on-chain confirmation, not this. */
export async function submitTransaction(transactionId: string, txHash: string): Promise<void> {
  await post(`/v1/transactions/${transactionId}/submit`, { txHash }).catch(() => {});
}

/** One poll: the lowercased status, or `undefined` on a transient error (5xx / network) worth retrying. */
async function pollActionStatus(actionId: string): Promise<string | undefined> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/v1/actions/${actionId}`, { headers: JSON_HEADERS });
  } catch {
    return undefined;
  }
  if (res.ok) return getString(await res.json(), "status")?.toLowerCase();
  // Gateway/upstream blips (502/503/504) are transient — keep polling; a 4xx is a real error.
  if (res.status >= 500) return undefined;
  throw new Error(`GET /v1/actions/${actionId} failed: ${res.status}`);
}

/** Polls the action to `success` (throws on `failed` or timeout); transient 5xx/network errors retry. */
export async function pollAction(actionId: string): Promise<void> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const status = await pollActionStatus(actionId);
    if (status === "success") return;
    if (status === "failed") throw new Error(`Action ${actionId} failed on-chain`);
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Action ${actionId} timed out`);
}

/**
 * Every position in a `POST /v1/positions` response, with whatever balances are
 * present. `marketId` lives on the nested balances; a fully-repaid position keeps
 * its collateral (`debtBalance` absent, `collateralBalance > 0`).
 */
export function findPositions(positionsResponse: unknown): OpenLoan[] {
  const positions = get(positionsResponse, "positions");
  const list: unknown[] = Array.isArray(positions) ? positions : [];
  return list
    .map((entry): OpenLoan | null => {
      const debt = get(entry, "debtBalance");
      const supply = get(entry, "supplyBalance");
      const marketId = getString(debt, "marketId") ?? getString(supply, "marketId");
      if (!marketId) return null;
      return {
        marketId,
        debtBalance: getString(debt, "balance"),
        collateralBalance: getString(supply, "balance"),
      };
    })
    .filter((p): p is OpenLoan => p !== null);
}
