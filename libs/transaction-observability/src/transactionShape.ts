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
 * at all (signRaw / signPsbt / ACRE).
 */
export function getRawTransactionType(tx: TransactionLike | undefined | null): string | undefined {
  if (!tx) return undefined;
  if (tx.family === "solana") return (tx.model as { kind?: string } | undefined)?.kind;
  return tx.mode as string | undefined;
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
