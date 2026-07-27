import { ethers } from "ethers";
import type {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCoinConfig } from "../config";
import { withApi } from "../network/node/rpc.common";
import { isExternalNodeConfig } from "../network/node/types";
import { isStakingIntent } from "../utils";
import { getStakingABI } from "./abis";
import { findFirstFreeWithdrawId } from "./validators/monad";

type StakingIntent = TransactionIntent<MemoNotSupported, BufferTxData>;

type GetDelegationResult = [string, bigint];
type ConvertToSharesResult = [bigint];
type WithdrawalFeeInGweiResult = [bigint];

function isGetDelegationResult(value: unknown): value is GetDelegationResult {
  return Array.isArray(value) && typeof value[0] === "string" && typeof value[1] === "bigint";
}

function isConvertToSharesResult(value: unknown): value is ConvertToSharesResult {
  return Array.isArray(value) && typeof value[0] === "bigint";
}

function isWithdrawalFeeInGweiResult(value: unknown): value is WithdrawalFeeInGweiResult {
  return Array.isArray(value) && typeof value[0] === "bigint";
}

/**
 * Per-currency hook that may enrich a staking intent with values that have to be
 * looked up at submission time (e.g. an on-chain "free slot" id). Returns the
 * intent unchanged when no enrichment is needed.
 */
type IntentPreparer = (currency: CryptoCurrency, intent: StakingIntent) => Promise<StakingIntent>;

const prepareMonadIntent: IntentPreparer = async (_currency, intent) => {
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

const prepareZeroGravityIntent: IntentPreparer = async (currency, intent) => {
  if (!isStakingIntent(intent)) return intent;
  if (intent.mode !== "undelegate" || intent.shares !== undefined || !intent.valAddress) {
    return intent;
  }
  if (!intent.useAllAmount && intent.amount <= 0n) return intent;

  const abi = getStakingABI(currency.id);
  if (!abi) return intent;

  const node = getCoinConfig(currency.id).info.node;
  if (!isExternalNodeConfig(node)) return intent;

  const iface = new ethers.Interface(abi as ethers.InterfaceAbi);
  const valAddress = intent.valAddress;
  const delegator = intent.sender;

  const { shares, txValue } = await withApi(
    currency,
    async provider => {
      const rawDelegation = await provider.call({
        to: valAddress,
        data: iface.encodeFunctionData("getDelegation", [delegator]),
      });
      const decodedDelegation = iface.decodeFunctionResult("getDelegation", rawDelegation);
      if (!isGetDelegationResult(decodedDelegation))
        throw new Error("unexpected getDelegation result");
      const availableShares = decodedDelegation[1];
      if (availableShares === 0n) throw new Error("no shares to undelegate from this validator");

      let shares: bigint;
      if (intent.useAllAmount) {
        shares = availableShares;
      } else {
        const raw = await provider.call({
          to: valAddress,
          data: iface.encodeFunctionData("convertToShares", [intent.amount]),
        });
        const decoded = iface.decodeFunctionResult("convertToShares", raw);
        if (!isConvertToSharesResult(decoded)) throw new Error("unexpected convertToShares result");
        shares = decoded[0];
        // Two consecutive floor divisions (convertToTokens then convertToShares) always lose
        // exactly 1 share on pools with accumulated rewards. Snap to availableShares when the
        // result is availableShares - 1, since that share cannot be undelegated anyway (contract
        // minimum: 1e9 shares).
        if (shares === 0n || shares === availableShares - 1n) shares = availableShares;
        if (shares > availableShares) throw new Error("requested amount exceeds delegated shares");
      }

      if (shares < 1_000_000_000n)
        throw new Error("cannot undelegate: shares below 0G contract minimum");

      const rawFee = await provider.call({
        to: valAddress,
        data: iface.encodeFunctionData("withdrawalFeeInGwei", []),
      });
      const decodedFee = iface.decodeFunctionResult("withdrawalFeeInGwei", rawFee);
      if (!isWithdrawalFeeInGweiResult(decodedFee)) {
        throw new Error("unexpected withdrawalFeeInGwei result");
      }

      const txValue = decodedFee[0] * 10n ** 9n;
      return { shares, txValue };
    },
    node,
  );

  const enriched: typeof intent = { ...intent, shares, txValue };
  return enriched;
};

const STAKING_INTENT_PREPARERS: Record<string, IntentPreparer> = {
  monad: prepareMonadIntent,
  zero_gravity: prepareZeroGravityIntent,
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
  return prepare ? prepare(currency, intent) : intent;
};
