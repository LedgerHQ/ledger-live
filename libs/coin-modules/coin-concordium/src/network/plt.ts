import type {
  PltAccountModuleState,
  PltAccountToken,
  PltEncodedState,
  PltListStatus,
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

/**
 * Checks whether the token's own lists block this account from transacting.
 *
 * Mirrors the chain rule: a deny-list token blocks an account that is on the
 * list; an allow-list token blocks an account that is not. A token that
 * declares neither feature never blocks. The module-level flag is consulted
 * first, since an account-level flag is only meaningful for a feature the token
 * declares.
 *
 * Either state can arrive as undecodable hex instead of an object, which yields
 * `unknown`. For an allow-list token an *absent* account state is not
 * ambiguous: membership requires a write, so absence means "not approved".
 *
 * Takes an existing entry. An account that never touched the token has no entry
 * at all, which callers must handle separately.
 */
export function getAccountListStatus(entry: PltAccountToken): PltListStatus {
  const moduleState = entry.token.tokenState.moduleState;
  if (!isDecodedPltState(moduleState)) return "unknown";

  const hasAllowList = moduleState.allowList === true;
  const hasDenyList = moduleState.denyList === true;
  if (!hasAllowList && !hasDenyList) return "allowed";

  const accountState = entry.tokenAccountState.state;
  if (accountState !== undefined && !isDecodedPltState(accountState)) return "unknown";

  if (hasDenyList && accountState?.denyList === true) return "blocked";
  if (hasAllowList && accountState?.allowList !== true) return "blocked";
  return "allowed";
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
