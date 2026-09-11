import type {
  PltAccountModuleState,
  PltAccountToken,
  PltEncodedState,
  PltListStatus,
  PltListVerdict,
  PltModuleState,
  PltRejectReason,
  PltTokenModuleRejectReason,
  WalletProxyRawRejectReason,
} from "../types";

/**
 * Narrows a CBOR-backed state blob to its decoded form.
 *
 * The node decodes these blobs, but falls back to the raw hex bytes when the
 * CBOR does not parse. Reading a field off the hex form yields `undefined`
 * rather than an error, which would silently read as "flag not set", so every
 * access must go through this guard.
 */
export function isDecodedPltState<T extends PltModuleState | PltAccountModuleState>(
  state: PltEncodedState<T> | undefined,
): state is T {
  return typeof state === "object" && state !== null && !Array.isArray(state);
}

/** Whether the list flags decoded as the booleans the schema promises. */
function hasReadableListFlags(state: { allowList?: unknown; denyList?: unknown }): boolean {
  return (
    (state.allowList === undefined || typeof state.allowList === "boolean") &&
    (state.denyList === undefined || typeof state.denyList === "boolean")
  );
}

/**
 * Reads a CBOR-backed state blob, or nothing when it did not decode as one.
 *
 * {@link isDecodedPltState} separates a decoded object from the raw hex the node
 * falls back to, but says nothing about the fields inside it. A flag that is
 * present and not a boolean fails every `=== true` test, which would read as
 * "no list is declared" — allowing a transfer off state that never decoded.
 */
export function readPltState<T extends PltModuleState | PltAccountModuleState>(
  state: PltEncodedState<T> | undefined,
): T | undefined {
  if (!isDecodedPltState(state)) return undefined;
  return hasReadableListFlags(state) ? state : undefined;
}

/**
 * Reads one `accountTokens` entry, or nothing when the fields that make it an
 * entry did not arrive.
 *
 * An empty `tokenId` is malformed rather than merely unmatched, the rule
 * `isUsableEntry` already applies on the sync path. `balance` is read only as
 * proof that the entry is real: `state` is legitimately absent, so nothing else
 * separates an account with no module state from an object carrying nothing.
 */
export function readAccountTokenEntry(value: unknown): PltAccountToken | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const entry = value as PltAccountToken;
  const tokenId = entry.token?.tokenId;
  if (typeof tokenId !== "string" || tokenId.length === 0) return undefined;

  const accountState = entry.tokenAccountState;
  if (typeof accountState !== "object" || accountState === null) return undefined;
  if (typeof accountState.balance?.value !== "string") return undefined;

  return entry;
}

/**
 * Reads a whole `accountTokens` list, or nothing when any part of it did not.
 *
 * One unreadable entry taints the list rather than being skipped: the entry that
 * failed to read could be the one being looked for, and not finding an entry is
 * what "the account is not on this list" is inferred from. Under a deny list
 * that inference means *allowed*, so a skipped entry is a fail-open.
 */
export function readAccountTokens(accountTokens: unknown): PltAccountToken[] | undefined {
  if (!Array.isArray(accountTokens)) return undefined;

  const entries: PltAccountToken[] = [];
  for (const value of accountTokens) {
    const entry = readAccountTokenEntry(value);
    if (!entry) return undefined;
    entries.push(entry);
  }
  return entries;
}

/**
 * Applies the token's list rules to one account, naming the rule that refused.
 *
 * The module-level flag is consulted first, since an account-level flag is only
 * meaningful for a feature the token declares.
 *
 * Deny is tested before allow, so an account on both lists reads as `denied`.
 * The chain refuses it either way; the order only decides which of the two the
 * user is told, and being on a deny list is the more specific fact.
 *
 * The account state can still arrive as undecodable hex instead of an object,
 * which yields `unknown`. An *absent* account state is not ambiguous:
 * membership requires a write, so absence means "not approved" under an allow
 * list and says nothing under a deny list.
 *
 * Both arguments have already been read by the functions above. `moduleState`
 * is a parameter rather than being read off `entry`, because the case this
 * exists to answer is the one with no entry to read it from — an account the
 * token has never written state for. That case needs the token's own state
 * fetched separately.
 */
export function getListVerdict(
  moduleState: PltModuleState,
  entry: PltAccountToken | undefined,
): PltListVerdict {
  const hasAllowList = moduleState.allowList === true;
  const hasDenyList = moduleState.denyList === true;
  if (!hasAllowList && !hasDenyList) return "allowed";

  if (!entry) return hasAllowList ? "notAllowed" : "allowed";

  // Absent `state` legitimately means the account has no module state, and so,
  // under a deny list, that it is not on the list. Present-but-unreadable is a
  // different answer: nothing can be concluded.
  let accountState: PltAccountModuleState | undefined;
  if (entry.tokenAccountState.state !== undefined) {
    accountState = readPltState(entry.tokenAccountState.state);
    if (!accountState) return "unknown";
  }

  if (hasDenyList && accountState?.denyList === true) return "denied";
  if (hasAllowList && accountState?.allowList !== true) return "notAllowed";
  return "allowed";
}

/**
 * Checks whether the token's own lists block this account from transacting.
 *
 * Folds {@link getListVerdict} down to the three states that survive being
 * persisted on the account: which rule refused is dropped, because only the
 * verdict is stored and a stored cause could not be trusted to still hold.
 *
 * Takes an existing entry. An account that never touched the token has no entry
 * at all, which callers must handle separately — {@link getListVerdict} takes
 * that case directly.
 */
export function getAccountListStatus(entry: PltAccountToken): PltListStatus {
  // Reads its own argument, unlike the recipient path, because sync hands this
  // one straight off the wire.
  const readable = readAccountTokenEntry(entry);
  const moduleState = readable && readPltState(readable.token.tokenState?.moduleState);
  if (!readable || !moduleState) return "unknown";

  const verdict = getListVerdict(moduleState, readable);
  return verdict === "allowed" || verdict === "unknown" ? verdict : "blocked";
}

/** Finds one token's entry among entries {@link readAccountTokens} has read. */
export function findAccountTokenEntry(
  accountTokens: PltAccountToken[],
  tokenId: string,
): PltAccountToken | undefined {
  return accountTokens.find(entry => entry.token.tokenId === tokenId);
}

function isTokenModuleRejectReason(value: unknown): value is PltTokenModuleRejectReason {
  if (typeof value !== "object" || value === null) return false;
  const { tokenId, type } = value as Partial<PltTokenModuleRejectReason>;
  return typeof tokenId === "string" && typeof type === "string";
}

/**
 * Narrows a raw reject reason to the two chain-level PLT tags.
 *
 * `contents` arrives as `unknown` off the wire, so a tag match alone would
 * assert a shape that was never verified.
 *
 * `TokenUpdateTransactionFailed` carries a module-defined `type` string, which
 * is open-ended: treat an unrecognised value as a generic failure rather than
 * mapping it.
 */
export function isPltRejectReason(
  reason: WalletProxyRawRejectReason | undefined,
): reason is PltRejectReason {
  switch (reason?.tag) {
    case "NonExistentTokenId":
      return typeof reason.contents === "string";
    case "TokenUpdateTransactionFailed":
      return isTokenModuleRejectReason(reason.contents);
    default:
      return false;
  }
}
