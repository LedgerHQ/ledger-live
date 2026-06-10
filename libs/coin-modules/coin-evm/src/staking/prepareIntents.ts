import type {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isStakingIntent } from "../utils";
import { findFirstFreeWithdrawId } from "./validators/monad";

type StakingIntent = TransactionIntent<MemoNotSupported, BufferTxData>;

/**
 * Per-currency hook that may enrich a staking intent with values that have to be
 * looked up at submission time (e.g. an on-chain "free slot" id). Returns the
 * intent unchanged when no enrichment is needed.
 */
type IntentPreparer = (intent: StakingIntent) => Promise<StakingIntent>;

const prepareMonadIntent: IntentPreparer = async intent => {
  if (!isStakingIntent(intent)) return intent;
  if (intent.mode !== "undelegate" || intent.withdrawId !== undefined || !intent.valId) {
    return intent;
  }

  const withdrawId = await findFirstFreeWithdrawId("monad", BigInt(intent.valId), intent.sender);
  if (withdrawId === null) {
    throw new Error(
      "No free Monad withdraw slot: all slots (0–255) are in use for this validator. " +
        "Withdraw a completed undelegation before undelegating again.",
    );
  }

  // Bind to the narrowed (EvmStakingIntent) type so the literal isn't checked for
  // excess props against the wider TransactionIntent return type.
  const enriched: typeof intent = { ...intent, withdrawId: withdrawId.toString() };
  return enriched;
};

const STAKING_INTENT_PREPARERS: Record<string, IntentPreparer> = {
  monad: prepareMonadIntent,
};

/**
 * Run any currency-specific intent fixup (e.g. resolve a free withdraw-id slot
 * for Monad) before encoding calldata. No-op for currencies without a registered
 * preparer.
 */
export const prepareStakingIntent = async (
  currency: CryptoCurrency,
  intent: StakingIntent,
): Promise<StakingIntent> => {
  const prepare = STAKING_INTENT_PREPARERS[currency.id];
  return prepare ? prepare(intent) : intent;
};
