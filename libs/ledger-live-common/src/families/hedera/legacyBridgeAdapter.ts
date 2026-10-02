import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import type {
  HederaAccount,
  Transaction as LegacyTransaction,
  TransactionStatus,
} from "@ledgerhq/coin-hedera/types/index";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AccountBridge } from "@ledgerhq/types-live";

type LegacyAccountBridge = AccountBridge<LegacyTransaction, HederaAccount, TransactionStatus>;

/** Either shape, or a mix of both: the output below keeps the generic fields it read. */
type BridgeInput = Omit<LegacyTransaction, "mode" | "properties"> & {
  mode: string;
  properties?: { stakingNodeId?: number | null; token?: TokenCurrency };
  memoValue?: string | null;
  valId?: string;
};

function toLegacyMode(mode: string): HEDERA_TRANSACTION_MODES {
  if (mode === "tokenAssociate") return HEDERA_TRANSACTION_MODES.TokenAssociate;
  if (mode === "claimReward") return HEDERA_TRANSACTION_MODES.ClaimRewards;
  return mode as HEDERA_TRANSACTION_MODES;
}

/**
 * Must stay idempotent: the legacy `prepareTransaction` returns its already converted output, which
 * comes back through here on every later call.
 */
export function toLegacyTransaction(tx: BridgeInput, token?: TokenCurrency): LegacyTransaction {
  const mode = toLegacyMode(tx.mode);
  // A `memoValue` key means the generic memo editor owns the memo.
  const memo = "memoValue" in tx ? (tx.memoValue ?? undefined) : tx.memo;
  const base = { ...tx, mode, memo };

  switch (mode) {
    case HEDERA_TRANSACTION_MODES.Delegate:
    case HEDERA_TRANSACTION_MODES.Redelegate: {
      // A `valId` key means the generic UI picked the node, even when it set it to undefined.
      let stakingNodeId = tx.properties?.stakingNodeId ?? null;
      if ("valId" in tx) stakingNodeId = tx.valId ? Number(tx.valId) : null;
      return { ...base, properties: { stakingNodeId } } as LegacyTransaction;
    }
    case HEDERA_TRANSACTION_MODES.Undelegate:
      return { ...base, properties: { stakingNodeId: null } } as LegacyTransaction;
    case HEDERA_TRANSACTION_MODES.TokenAssociate:
      return { ...base, properties: { token: token ?? tx.properties?.token } } as LegacyTransaction;
    default:
      return base as LegacyTransaction;
  }
}

/** Lets the legacy bridge take the generic transaction shape, so the apps write only that shape. */
export function withGenericTransactionSupport(bridge: LegacyAccountBridge): LegacyAccountBridge {
  return {
    ...bridge,
    prepareTransaction: async (account, tx) => {
      const input: BridgeInput & { assetReference?: string } = tx;
      // The legacy status reads the association token from `properties`, the generic shape has only its address.
      const token =
        toLegacyMode(input.mode) === HEDERA_TRANSACTION_MODES.TokenAssociate &&
        !input.properties?.token &&
        input.assetReference
          ? await getCryptoAssetsStore().findTokenByAddressInCurrency(
              input.assetReference,
              account.currency.id,
            )
          : undefined;
      return bridge.prepareTransaction(account, toLegacyTransaction(input, token));
    },
    getTransactionStatus: (account, tx) =>
      bridge.getTransactionStatus(account, toLegacyTransaction(tx)),
    estimateMaxSpendable: args =>
      bridge.estimateMaxSpendable({
        ...args,
        transaction: args.transaction && toLegacyTransaction(args.transaction),
      }),
    signOperation: args =>
      bridge.signOperation({ ...args, transaction: toLegacyTransaction(args.transaction) }),
  };
}
