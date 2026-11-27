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
const THROTTLE_RETRY_ATTEMPTS = 6;
const THROTTLE_RETRY_BASE_DELAY_MS = 4_000;
const SUBMIT_RETRY_ATTEMPTS = 30;
const SUBMIT_RETRY_DELAY_MS = 2_000;

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

/**
 * Rejected by the edge before the partner saw the request. A partner-side 5xx is deliberately not
 * included: `post` also builds actions, and retrying one the partner already accepted but whose
 * response was lost would leave a second action behind.
 */
function isEdgeRejection(status: number): boolean {
  return status === 403 || status === 429;
}

function isTransientRead(status: number): boolean {
  return status >= 500 || status === 429;
}

/**
 * Staging answers a lookup of an action or transaction it has just created with a 404 more often
 * than not, alternating with 200 for the same id. Only for ids the partner itself handed out.
 */
function isLookupFlap(status: number): boolean {
  return status === 404;
}

/** A repeat sends the same hash for the same transaction, so it cannot leave anything behind. */
function isRetriableSubmit(status: number): boolean {
  return isEdgeRejection(status) || isLookupFlap(status) || status >= 500;
}

type PostOptions = { pathname: string; body: unknown; retryOn5xx?: boolean };

function postOnce(options: Omit<PostOptions, "retryOn5xx">): Promise<Response> {
  const { pathname, body } = options;
  return fetch(`${BASE_URL}${pathname}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

/** `retryOn5xx` is for the endpoints that only read, where a repeat cannot create anything. */
async function post(options: PostOptions): Promise<Response> {
  const { pathname, body, retryOn5xx = false } = options;
  for (let attempt = 1; ; attempt++) {
    const res = await postOnce({ pathname, body });
    const retriable = isEdgeRejection(res.status) || (retryOn5xx && res.status >= 500);
    if (!retriable || attempt >= THROTTLE_RETRY_ATTEMPTS) return res;
    console.log(
      `    api: ${res.status} on ${pathname}, retrying (${attempt}/${THROTTLE_RETRY_ATTEMPTS - 1})`,
    );
    await new Promise(resolve => setTimeout(resolve, THROTTLE_RETRY_BASE_DELAY_MS * attempt));
  }
}

/** The partner puts the actionable reason in the body, not the status line. */
async function failedRequest(request: string, res: Response): Promise<Error> {
  const detail = await res.text().catch(() => "");
  const reason = detail ? ` — ${detail}` : "";
  return new Error(`${request} failed: ${res.status} ${res.statusText}${reason}`);
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
  const res = await post({
    pathname: "/v1/positions",
    body: [{ network: ETHEREUM_NETWORK, address }],
    retryOn5xx: true,
  });
  if (!res.ok) throw await failedRequest("POST /v1/positions", res);
  return res.json();
}

/** Builds an action; returns `{ actionId, steps[] }`. Staging returns all steps upfront. */
export async function postAction(body: ActionRequest): Promise<PartnerActionResponse> {
  const res = await post({ pathname: "/v1/actions", body });
  if (!res.ok) throw await failedRequest("POST /v1/actions", res);
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

type AllowanceSpenderOptions = {
  steps: PartnerActionStep[];
  action: BorrowAction;
  marketId: string;
};

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
function requireAllowanceSpender(options: AllowanceSpenderOptions): string {
  const { steps, action, marketId } = options;
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

type CollateralSpenderOptions = {
  address: string;
  collateralAmount: string;
  loanAmount: string;
  marketId?: string;
};

type RepaySpenderOptions = { address: string; marketId: string };

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
export async function resolveCollateralSpender(options: CollateralSpenderOptions): Promise<string> {
  const { address, collateralAmount, loanAmount, marketId = DEFAULT_MARKET_ID } = options;
  const { steps } = await postAction({
    address,
    action: "supplyAndBorrow",
    args: { marketId, amount: loanAmount, collateralAmount },
  });
  return requireAllowanceSpender({ steps, action: "supplyAndBorrow", marketId });
}

/**
 * Same for the debt-token allowance a repay pulls through. `marketId` is the long id of the
 * position being repaid (not a market's `collateral[].id`), so an open loan with debt must
 * already exist — the partner has nothing to build a repay against otherwise.
 */
export async function resolveRepaySpender(options: RepaySpenderOptions): Promise<string> {
  const { address, marketId } = options;
  const { steps } = await postAction({
    address,
    action: "repay",
    args: { marketId, repayAll: true },
  });
  return requireAllowanceSpender({ steps, action: "repay", marketId });
}

type SubmitTransactionOptions = { transactionId: string; txHash: string };

/**
 * The partner leaves an action at `created` until it is given each step's hash, so every transient
 * failure, network errors included, is retried under one budget of `SUBMIT_RETRY_ATTEMPTS`. Not
 * thrown: the step is already confirmed on chain, and `pollAction` names an action left unsettled.
 */
export async function submitTransaction(options: SubmitTransactionOptions): Promise<void> {
  const { transactionId, txHash } = options;
  const pathname = `/v1/transactions/${transactionId}/submit`;
  const request = `POST ${pathname}`;
  let lastFailure = "";
  for (let attempt = 1; attempt <= SUBMIT_RETRY_ATTEMPTS; attempt++) {
    if (attempt > 1) await new Promise(resolve => setTimeout(resolve, SUBMIT_RETRY_DELAY_MS));
    try {
      const res = await postOnce({ pathname, body: { txHash } });
      if (res.ok) return;
      lastFailure = (await failedRequest(request, res)).message;
      if (!isRetriableSubmit(res.status)) break;
    } catch (error) {
      lastFailure = `${request} failed: ${String(error)}`;
    }
  }
  console.warn(`    api: ${lastFailure}`);
}

type ActionPoll = { status: string } | { retryReason: string };

async function pollActionStatus(actionId: string): Promise<ActionPoll> {
  const request = `GET /v1/actions/${actionId}`;
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/v1/actions/${actionId}`, { headers: JSON_HEADERS });
  } catch (error) {
    return { retryReason: `${request} failed: ${String(error)}` };
  }
  if (res.ok) {
    return { status: getString(await res.json(), "status")?.toLowerCase() ?? "missing" };
  }
  const failure = await failedRequest(request, res);
  if (isTransientRead(res.status) || isLookupFlap(res.status)) {
    return { retryReason: failure.message };
  }
  throw failure;
}

/** Polls the action to `success` (throws on `failed` or timeout), polling through transient errors. */
export async function pollAction(actionId: string): Promise<void> {
  let lastPoll = "none";
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const poll = await pollActionStatus(actionId);
    if ("status" in poll) {
      if (poll.status === "success") return;
      if (poll.status === "failed") throw new Error(`Action ${actionId} failed on-chain`);
      lastPoll = `status ${poll.status}`;
    } else {
      lastPoll = poll.retryReason;
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Action ${actionId} timed out (last poll: ${lastPoll})`);
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
