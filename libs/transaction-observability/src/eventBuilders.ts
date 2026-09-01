import type {
  Account,
  AccountLike,
  Operation,
  SignedOperation,
  TransactionSource,
} from "@ledgerhq/types-live";
// @shared/env (not @ledgerhq/live-env) so the env definitions are guaranteed injected.
import { getEnv } from "@shared/env";
import {
  TransactionDataSource,
  TransactionStage,
  type CommonLogEvent,
  type FailureLogEvent,
  type SuccessLogEvent,
  type TransactionPathway,
} from "./logEvent";
import { deriveEarnTransactionType, type EarnTransactionType } from "./earnTransactionType";
import { deriveFromOperationType } from "./operationType";
import { getStakeTarget, type TransactionLike } from "./transactionShape";
import { isStakingApp, stakingMethodOf } from "./stakingApps";
import { outputCurrencyOf, stakingMethodOfContract } from "./stakingContracts";
import { readAction } from "./resolveAction";
import { recallSignContext } from "./signContext";
import { classifyTransactionError, ErrorCategory, toError, unwrapRpcError } from "./errorCategory";

type Attribution = {
  /** The signing account — read for the token id/ticker. */
  account: AccountLike;
  /** The resolved main account — read for currency, family and testnet. */
  mainAccount: Account;
  pathway: TransactionPathway;
  manifestId?: string;
  source?: TransactionSource;
};

type ActionFields = {
  earnTransactionType?: EarnTransactionType;
  rawTransactionType?: string;
  dappContract?: string;
  validators?: string[];
  isSendMax: boolean;
  dataSource: TransactionDataSource;
};

function buildCommon(attribution: Attribution, action: ActionFields): CommonLogEvent {
  const { account, mainAccount, pathway, manifestId, source } = attribution;
  const stakingMethod = stakingMethodOfContract(action.dappContract) ?? stakingMethodOf(manifestId);
  const outputCurrency = outputCurrencyOf(action.dappContract);
  return {
    appVersion: getEnv("LEDGER_CLIENT_VERSION"),
    pathway,
    currencyId: mainAccount.currency.id,
    family: mainAccount.currency.family,
    currencyTicker: mainAccount.currency.ticker,
    isTestnet: Boolean(mainAccount.currency.isTestnetFor),
    isSendMax: action.isSendMax,
    dataSource: action.dataSource,
    ...(manifestId ? { manifestId } : {}),
    // The contract is the more precise of the two: it distinguishes Kiln's pooled product
    // from its dedicated one, which share a manifest. The manifest covers everything else.
    ...(stakingMethod ? { stakingMethod } : {}),
    ...(outputCurrency ? { outputCurrency } : {}),
    ...(source ? { source } : {}),
    ...(action.earnTransactionType ? { earnTransactionType: action.earnTransactionType } : {}),
    ...(action.rawTransactionType ? { rawTransactionType: action.rawTransactionType } : {}),
    ...(action.dappContract ? { dappContract: action.dappContract } : {}),
    ...(action.validators?.length ? { validators: action.validators } : {}),
    ...(account.type === "TokenAccount"
      ? { tokenId: account.token.id, tokenTicker: account.token.ticker }
      : {}),
  };
}

/**
 * Sign-stage event data, built from the rich transaction: the family's own action wording
 * and the delegation target, neither of which survives to broadcast.
 */
export function buildSignCommonEvent(
  attribution: Attribution & { transaction?: TransactionLike | null },
): CommonLogEvent {
  const { transaction } = attribution;
  return buildCommon(attribution, {
    ...readAction(attribution.mainAccount.currency.family, attribution.manifestId, transaction),
    validators: getStakeTarget(transaction),
    isSendMax: Boolean(transaction?.useAllAmount),
    dataSource: TransactionDataSource.Sign,
  });
}

type OperationExtra = {
  validators?: Array<{ address?: string } | string>;
  votes?: Array<{ address?: string }>;
  targetStakingNodeId?: number | string | null;
  celoSourceValidator?: string;
};

/**
 * Reads the delegation target off the optimistic operation. Only some families copy it
 * across: cosmos and hedera always, celo/polkadot/tron for a subset of their actions, and
 * cardano / solana / sui / near / multiversx not at all. That unevenness is precisely why
 * sign↔broadcast correlation is worth having.
 */
function stakeTargetFromOperation(operation: Operation): string[] | undefined {
  const extra = (operation.extra ?? {}) as OperationExtra;
  const raw = operation.transactionRaw as { valAddress?: string } | undefined;
  const candidates = [
    ...(extra.validators ?? []).map(v => (typeof v === "string" ? v : v?.address)),
    ...(extra.votes ?? []).map(v => v?.address),
    extra.celoSourceValidator,
    extra.targetStakingNodeId != null ? String(extra.targetStakingNodeId) : undefined,
    raw?.valAddress,
  ].filter((a): a is string => Boolean(a));
  return candidates.length ? candidates : undefined;
}

/**
 * Broadcast-stage event data. There is no transaction here, only the optimistic operation.
 *
 * `Operation.type` is a coarser vocabulary than the sign stage's, so for the generic-coin
 * -framework families (evm, tezos) the exact original mode is preferred where it survives on
 * `transactionRaw` — that is the only way to tell an EVM `claimReward` from a
 * `compoundReward`, since both become `REWARD`.
 */
export function buildBroadcastCommonEvent(
  attribution: Attribution & { signedOperation: SignedOperation },
): CommonLogEvent {
  const { signedOperation, mainAccount } = attribution;
  const { operation } = signedOperation;
  const family = mainAccount.currency.family;

  // The sign stage saw the real transaction. Where that correlates, its data is strictly
  // better than anything recoverable here — and for the families that report a generic
  // operation type it is the only thing that makes the action legible at all.
  const signed = recallSignContext(signedOperation);
  if (signed?.earnTransactionType) {
    return buildCommon(attribution, {
      ...signed,
      // Celo and tron put the target only on the optimistic operation (`celoSourceValidator`,
      // `extra.votes`), where the sign stage cannot see it — so take whichever stage has one
      // rather than letting a correlation hit throw the other away.
      validators: signed.validators ?? stakeTargetFromOperation(operation),
      // The operation carries the recipient too, so a context stored without a contract
      // (a rehydrated one, or one from before this field existed) still resolves.
      dappContract: signed.dappContract ?? contractFromOperation(attribution, operation),
      dataSource: TransactionDataSource.Sign,
    });
  }

  // The generic coin framework copies the transaction onto the operation. Observed on a real
  // Lido deposit: `recipients[0]` is the contract and `transactionRaw` carries `mode` plus the
  // call data as a bare hex string with no `0x`. The shape comes from the coin module, not the
  // route, so it holds for the dApp providers too.
  //
  // That makes a contract call classifiable without the sign stage, which matters wherever
  // correlation misses: it keys on object identity, so a signed operation serialised and
  // rehydrated — persisted, or handed back across the wallet-api boundary — will not match.
  const raw = operation.transactionRaw as { mode?: string; data?: string } | undefined;
  const fromOperation = readAction(family, attribution.manifestId, {
    family,
    mode: raw?.mode,
    data: raw?.data,
    recipient: operation.recipients?.[0],
  });

  // `readAction` echoes the mode back as the raw type even when it classifies nothing, so a
  // plain `send` would otherwise shadow the operation type. Keep its wording only when it
  // actually said something: an action, or a contract call whose selector is worth reporting.
  const spoke =
    fromOperation.earnTransactionType !== undefined || fromOperation.dappContract !== undefined;

  return buildCommon(attribution, {
    ...fromOperation,
    earnTransactionType:
      fromOperation.earnTransactionType ?? deriveFromOperationType(family, operation.type),
    rawTransactionType: spoke ? fromOperation.rawTransactionType : operation.type,
    validators: stakeTargetFromOperation(operation),
    isSendMax: false,
    dataSource: TransactionDataSource.Broadcast,
  });
}

/**
 * The called contract, read off the optimistic operation.
 *
 * Gated on the manifest for the same reason the sign stage is: a plain send's recipient is the
 * user's own payee, and must never be reported as a staking contract.
 */
function contractFromOperation(attribution: Attribution, operation: Operation): string | undefined {
  if (!isStakingApp(attribution.manifestId)) return undefined;
  const recipient = operation.recipients?.[0];
  return typeof recipient === "string" ? recipient.toLowerCase() : undefined;
}

export function buildTransactionSuccessEvent(common: CommonLogEvent): SuccessLogEvent {
  return { status: "success", stage: TransactionStage.Broadcast, ...common };
}

/**
 * Drop-off event: the user dismissed the sign prompt without confirming or erroring. That is
 * an unsubscribe rather than an error, so it is invisible to the bridge and comes from the
 * device-action layer.
 */
export function buildTransactionAbandonedEvent(common: CommonLogEvent): FailureLogEvent {
  return {
    status: "failure",
    stage: TransactionStage.Sign,
    error: Object.assign(new Error("Sign prompt dismissed"), { name: "UserModalDismissed" }),
    errorCategory: ErrorCategory.UserModalDismissed,
    ...common,
  };
}

export type BuildTransactionFailureParams = {
  stage: TransactionStage;
  error: unknown;
  /** Only available when signing succeeded (broadcast-stage failures). */
  signedOperation?: SignedOperation;
};

export function buildTransactionFailureEvent(
  common: CommonLogEvent,
  { stage, error, signedOperation }: BuildTransactionFailureParams,
): FailureLogEvent {
  // Unwrapped once, here, so both the category and the reported `error.name` describe the
  // real cause rather than an RPC envelope.
  const err = toError(unwrapRpcError(error));
  return {
    status: "failure",
    stage,
    error: err,
    errorCategory: classifyTransactionError(err),
    ...(signedOperation
      ? {
          txPayload: {
            signature: signedOperation.signature,
            ...(signedOperation.rawData ? { rawData: signedOperation.rawData } : {}),
          },
        }
      : {}),
    ...common,
  };
}
