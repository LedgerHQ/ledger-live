/**
 * Structural view of a transaction — enough to read the staking action and its target.
 *
 * Deliberately not the coin-module `Transaction` union nor the wallet-api one: the bridge
 * seam hands over whichever of those the route produced, and this package must not depend on
 * either family layer to read two fields off them.
 */
export type TransactionLike = { family?: string } & Record<string, unknown>;

/**
 * Reads the family-specific staking action off a transaction, at the sign stage.
 *
 * Almost every family exposes it as `mode`; Solana is the exception and uses a dotted
 * `model.kind`. EVM is deliberately *not* special-cased: its native staking flows set a
 * `mode` alongside `valAddress`, while a plain send or a dApp call has none — so falling
 * through to `mode` scopes this to in-app staking without inspecting call data.
 *
 * `undefined` when the transaction carries no action, or when there is no rich transaction
 * at all (signRaw / signPsbt).
 */
export function getRawTransactionType(tx: TransactionLike | undefined | null): string | undefined {
  if (!tx) return undefined;
  if (tx.family === "solana") return (tx.model as { kind?: string } | undefined)?.kind;
  // TON has no mode: the action is the payload's type. Only the type is read — a comment
  // payload's text is the user's own.
  if (tx.family === "ton") return (tx.payload as { type?: string } | undefined)?.type;
  return tx.mode as string | undefined;
}

// Exact keywords only, mapped to fixed tokens: the comment is user-writable text, so it is
// matched but never reported.
const TON_POOL_COMMENTS: Record<string, string> = {
  // Observed: a P2P stake is a plain transfer to the pool carrying `Deposit`. A P2P withdrawal
  // is not a comment: it sends the `tonwhales-pool-withdraw` payload.
  Deposit: "pool-comment-deposit",
};

/**
 * The action of a TON nominator-pool transfer, which carries it as a text comment instead of
 * a payload. Only meaningful inside a known staking app: outside one, a transfer saying
 * "Deposit" is just a transfer.
 */
export function getTonPoolAction(tx: TransactionLike | undefined | null): string | undefined {
  if (tx?.family !== "ton") return undefined;
  const comment = tx.comment as { isEncrypted?: boolean; text?: unknown } | undefined;
  const payload = tx.payload as { type?: string; text?: unknown } | undefined;
  // Routes that pre-build the message carry the same text as a comment payload instead.
  const text = payload?.type === "comment" ? payload.text : !comment?.isEncrypted && comment?.text;
  return typeof text === "string" && Object.hasOwn(TON_POOL_COMMENTS, text)
    ? TON_POOL_COMMENTS[text]
    : undefined;
}

/**
 * The four-byte function selector of an EVM contract call, or `undefined` for a plain transfer.
 *
 * Read only when the transaction carries no staking `mode`, so EVM chains that stake natively
 * (sei_evm, monad and the rest set a generic-framework mode) keep using their own vocabulary
 * and never fall through to here.
 *
 * Deliberately takes only the selector. The rest of the call data holds amounts and addresses
 * and has no place in product analytics.
 */
export function getDappSelector(tx: TransactionLike | undefined | null): string | undefined {
  const data = tx?.data;
  if (data === undefined || data === null) return undefined;

  // A live transaction carries a Buffer. A serialised one carries a string, and the optimistic
  // operation's is *unprefixed* — observed as `a1903eab…` on a real Lido deposit — while other
  // routes prefix it. So normalise rather than assume: reading a prefixed string as a Buffer
  // yields `0x0x095ea7`, which looks like a selector and is not one.
  const hex =
    typeof data === "string"
      ? data.replace(/^0x/i, "")
      : (data as { toString(encoding: "hex"): string }).toString("hex");

  return /^[0-9a-f]{8}/i.test(hex) ? `0x${hex.slice(0, 8).toLowerCase()}` : undefined;
}

function nonEmptyStrings(list?: (string | undefined | null)[]): string[] | undefined {
  const filtered = (list ?? []).filter((a): a is string => Boolean(a));
  return filtered.length ? filtered : undefined;
}

/**
 * Extracts the delegation target(s) — validator address(es) or staking pool id — from a
 * transaction.
 *
 * Only families with an unambiguous, dedicated target field are handled. Families that
 * overload the generic `recipient` (near, tezos, multiversx, celo, sui) are intentionally
 * skipped, so a plain send's payee can never be reported as a validator.
 */
export function getStakeTarget(tx: TransactionLike | undefined | null): string[] | undefined {
  if (!tx) return undefined;
  const t = tx as {
    poolId?: string;
    valAddress?: string;
    validators?: Array<{ address?: string } | string>;
    votes?: Array<{ address?: string }>;
    familySpecificData?: { votes?: Array<{ address?: string }> };
    stakingNodeId?: number | null;
    model?: { uiState?: { voteAccAddr?: string; delegate?: { voteAccAddress?: string } } };
  };
  switch (tx.family) {
    case "cardano":
      return t.poolId ? [t.poolId] : undefined;
    case "cosmos":
      return nonEmptyStrings(t.validators?.map(v => (typeof v === "string" ? v : v?.address)));
    case "polkadot":
      return nonEmptyStrings(t.validators as (string | undefined)[] | undefined);
    // Since tron moved onto the generic coin framework its votes travel in
    // `familySpecificData`; the top-level field is still read for anything predating that.
    case "tron":
      return nonEmptyStrings(
        (t.familySpecificData?.votes ?? t.votes)?.map(v =>
          typeof v === "string" ? v : v?.address,
        ),
      );
    case "hedera":
      return t.stakingNodeId != null ? [String(t.stakingNodeId)] : undefined;
    case "solana": {
      const addr = t.model?.uiState?.voteAccAddr ?? t.model?.uiState?.delegate?.voteAccAddress;
      return addr ? [addr] : undefined;
    }
    default:
      // EVM native staking carries the validator on the generic transaction.
      return t.valAddress ? [t.valAddress] : undefined;
  }
}
