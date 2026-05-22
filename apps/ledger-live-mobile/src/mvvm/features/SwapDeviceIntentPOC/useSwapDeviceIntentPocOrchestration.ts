import BigNumber from "bignumber.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createIntent,
  type DeviceConnectionParams,
  type DeviceIntentExecutorProps,
  type Intent,
} from "@ledgerhq/device-intent";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import {
  buildProviderTransactionData,
  DEFAULT_DEX_GAS_LIMIT,
  DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
  isDexExecutionProvider,
  type DexBuildContext,
  type DexProvider,
  type DexTransactionData,
} from "@ledgerhq/live-common/wallet-api/Exchange/dex/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import { SWAP_POC_INTENT_DEFS } from "./intents/registry";
import type {
  SignApprovalEvmIntent,
  SignApprovalEvmIntentInput,
  SignApprovalEvmJobState,
} from "./intents/signApprovalEvmIntent/types";
import type {
  SignSwapEvmIntent,
  SignSwapEvmIntentInput,
  SignSwapEvmJobState,
} from "./intents/signSwapEvmIntent/types";
import type {
  BroadcastEvmIntent,
  BroadcastEvmIntentInput,
  BroadcastEvmJobState,
} from "./intents/broadcastEvmIntent/types";
import type { CustomSwapParams, CustomSwapResult } from "./types";

const DrawerClosedError = createCustomErrorClass("DrawerClosedError");

const DEFAULT_CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const ETHEREUM_INITIALIZATION_INPUT: InitializationInput = {
  appName: "Ethereum",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
};

// Every POC intent emits through the same executor, so the executor props are
// typed as the broadest union of their job states and inputs. Each phase
// keeps the precise Intent instance internally and we cast at the boundary.
type AnyJobState =
  | SignApprovalEvmJobState
  | SignSwapEvmJobState
  | BroadcastEvmJobState;
type AnyInput =
  | SignApprovalEvmIntentInput
  | SignSwapEvmIntentInput
  | BroadcastEvmIntentInput;
type AnyExtraProps = Record<string, never>;

/**
 * Saved context needed to build and sign the swap transaction once the
 * approval confirms. Captured upfront in `customSwapHandler` so the
 * orchestration does not need to re-resolve currencies or amounts later.
 */
type SwapBuildPlan = {
  provider: DexProvider;
  context: DexBuildContext;
};

type SwapPocPhase =
  | { phase: "idle" }
  | {
      phase: "sign-approval";
      intent: SignApprovalEvmIntent;
      deviceInitializationInput: InitializationInput;
    }
  | {
      phase: "broadcast-approval";
      intent: BroadcastEvmIntent;
      deviceInitializationInput: InitializationInput;
      approvalSignedTxHex: string;
    }
  | { phase: "approval-success"; approvalTxHash: string }
  | { phase: "build-swap"; approvalTxHash: string }
  | {
      phase: "sign-swap";
      intent: SignSwapEvmIntent;
      deviceInitializationInput: InitializationInput;
      approvalTxHash: string;
    }
  | {
      phase: "broadcast-swap";
      intent: BroadcastEvmIntent;
      deviceInitializationInput: InitializationInput;
      approvalTxHash: string;
      swapSignedTxHex: string;
    }
  | { phase: "swap-success"; approvalTxHash: string; swapTxHash: string }
  | { phase: "error"; error: Error };

type PendingPromise = {
  resolve: (value: CustomSwapResult) => void;
  reject: (error: Error) => void;
  /** Main EVM account to keep around between the sign and broadcast intents. */
  mainAccount: Account;
  /** Pre-computed plan for the swap step (when the quote is a supported DEX provider). */
  swapPlan: SwapBuildPlan | null;
};

/**
 * Information needed to render the post-approval or post-swap confirmation
 * sheet. Populated once the matching broadcast intent confirms on-chain
 * and consumed by {@link SwapDeviceIntentPocHost}. Dismissing the
 * approval-success sheet (Swap CTA, X or backdrop) either triggers the
 * swap step or resolves the live-app `customSwap` Promise with the
 * approval hash only. Dismissing the swap-success sheet always resolves
 * with both hashes.
 */
export type SwapPocSuccessScreen =
  | {
      kind: "approval";
      /** Hash of the broadcast-and-confirmed approval transaction. */
      approvalTxHash: string;
      /** Called when the user taps the primary "Swap" CTA (kicks off the swap step). */
      onSwapPress: () => void;
      /** Called when the user dismisses the sheet (X or backdrop) — resolves with approval only. */
      onClose: () => void;
    }
  | {
      kind: "swap";
      /** Hash of the broadcast-and-confirmed approval transaction. */
      approvalTxHash: string;
      /** Hash of the broadcast-and-confirmed swap transaction. */
      swapTxHash: string;
      /** Called when the user taps the primary "Done" CTA. */
      onDonePress: () => void;
      /** Called when the user dismisses the sheet (X or backdrop). */
      onClose: () => void;
    };

export type SwapDeviceIntentPocOrchestrationResult = {
  /** Wallet API handler to register as `custom.swap`. */
  customSwapHandler: (request: { params?: CustomSwapParams }) => Promise<CustomSwapResult>;
  /** Props to pass to the LWM executor while a flow is running, or `null` if idle. */
  executorProps: DeviceIntentExecutorProps<
    AnyJobState,
    AnyInput,
    AnyExtraProps,
    InitializationInput
  > | null;
  /** Info needed to render the post-approval / post-swap success sheet, or `null` otherwise. */
  successScreen: SwapPocSuccessScreen | null;
  /** Whether the host should mount any swap-POC UI (executor or success sheet). */
  enabled: boolean;
};

/**
 * Resolves the wallet API account id to the parent EVM account that owns the
 * spending allowance. The handler accepts either a token sub-account id or
 * a main account id; we always sign from the main account so the bridge can
 * look up nonce / fees and produce a broadcast-ready signed transaction.
 */
function resolveEvmMainAccount(walletAccountId: string, accounts: AccountLike[]): Account {
  const realAccountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!realAccountId) {
    throw new Error(`accountId ${walletAccountId} unknown`);
  }
  const account = accounts.find(acc => acc.id === realAccountId);
  if (!account) {
    throw new Error(`accountId ${walletAccountId} unknown`);
  }
  const parent = getParentAccount(account, accounts);
  const main = getMainAccount(account, parent);
  if (main.currency.family !== "evm") {
    throw new Error(
      `custom.swap POC supports EVM source accounts only (got ${main.currency.family})`,
    );
  }
  return main;
}

/**
 * Resolves the currency id for a wallet-API account id, picking the token
 * id for sub-accounts and the crypto-currency id otherwise. Returns
 * `undefined` when the id cannot be resolved so the caller can decide
 * whether to fail open (the DEX builders tolerate undefined fields).
 */
function resolveCurrencyId(
  walletAccountId: string,
  accounts: AccountLike[],
): string | undefined {
  const realAccountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!realAccountId) return undefined;
  const account = accounts.find(acc => acc.id === realAccountId);
  if (!account) return undefined;
  return account.type === "TokenAccount" ? account.token.id : account.currency.id;
}

/**
 * Builds the upfront DEX execution plan from the live-app `custom.swap`
 * payload, or returns `null` when the quote does not target a native DEX
 * provider. Same idea as the live-app's `useDexExecution`: snapshot
 * everything the swap-api builders need before the device flow starts.
 */
function buildSwapPlan(
  params: CustomSwapParams,
  mainAccount: Account,
  accounts: AccountLike[],
): SwapBuildPlan | null {
  const candidate = {
    provider: params.quote.provider,
    providerType: params.quote.providerDetails?.type,
  };
  if (!isDexExecutionProvider(candidate)) {
    return null;
  }

  const context: DexBuildContext = {
    customFields: params.quote.customFields,
    fromCurrencyId: resolveCurrencyId(params.fromAccountId, accounts),
    toCurrencyId: resolveCurrencyId(params.toAccountId, accounts),
    fromAccountAddress: mainAccount.freshAddress,
    amountFrom: new BigNumber(params.quote.quoteDetails.sendAmount),
    slippage: params.quote.quoteDetails.slippage,
    gasLimitMultiplier: DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
    defaultGasLimit: DEFAULT_DEX_GAS_LIMIT,
  };

  return { provider: candidate.provider, context };
}

/**
 * Orchestrates the swap POC end-to-end: token approval (sign + broadcast
 * + on-chain wait) → optional swap step (build calldata via
 * `buildProviderTransactionData()` → sign + broadcast + on-chain wait).
 *
 * The hook exposes a `custom.swap`-compatible handler and the props
 * needed to mount {@link DeviceIntentExecutorLWM} alongside the swap
 * webview. Phase transitions follow the device-intent README contract:
 * we react to `onIntentJobComplete` (never `onIntentJobStateChanged`),
 * keep `intent` and `deviceInitializationInput` in the same state
 * update, and create fresh Intent instances via {@link createIntent} on
 * every transition.
 */
export function useSwapDeviceIntentPocOrchestration({
  accounts,
}: {
  accounts: AccountLike[];
}): SwapDeviceIntentPocOrchestrationResult {
  const [phase, setPhase] = useState<SwapPocPhase>({ phase: "idle" });
  const [enabled, setEnabled] = useState(false);
  const lastJobStateRef = useRef<AnyJobState | null>(null);
  const pendingPromiseRef = useRef<PendingPromise | null>(null);

  const rejectAndReset = useCallback((error: Error) => {
    pendingPromiseRef.current?.reject(error);
    pendingPromiseRef.current = null;
    lastJobStateRef.current = null;
    setEnabled(false);
    setPhase({ phase: "error", error });
  }, []);

  const handleJobStateChanged = useCallback((jobState: AnyJobState) => {
    lastJobStateRef.current = jobState;
  }, []);

  const handleJobComplete = useCallback(() => {
    const last = lastJobStateRef.current;
    const pending = pendingPromiseRef.current;
    if (!pending) return;

    setPhase(current => {
      if (current.phase === "sign-approval") {
        if (last && "type" in last && last.type === "signed") {
          // Same-render transition: swap intent + keep the same init input so
          // the executor absorbs the change as a self-transition (see README,
          // "Changing deviceInitializationInput and intent together").
          const broadcastIntent = createIntent(SWAP_POC_INTENT_DEFS.broadcast, {
            signedTxHex: last.signedTxHex,
            currencyId: pending.mainAccount.currency.id,
          });
          return {
            phase: "broadcast-approval",
            intent: broadcastIntent,
            deviceInitializationInput: current.deviceInitializationInput,
            approvalSignedTxHex: last.signedTxHex,
          };
        }
        const error =
          last && "type" in last && last.type === "failed"
            ? last.error
            : new Error("Approval signing did not produce a signed transaction");
        pending.reject(error);
        pendingPromiseRef.current = null;
        lastJobStateRef.current = null;
        setEnabled(false);
        return { phase: "error", error };
      }

      if (current.phase === "broadcast-approval") {
        if (last && "type" in last && last.type === "confirmed") {
          // Hold the Promise: tapping the Swap CTA on the approval-success
          // sheet kicks off the swap step. Backdrop / X dismissal resolves
          // the Promise with `{ approvalTxHash }` only.
          lastJobStateRef.current = null;
          return { phase: "approval-success", approvalTxHash: last.hash };
        }
        const error =
          last && "type" in last && last.type === "failed"
            ? last.error
            : new Error("Broadcast did not confirm the approval transaction");
        pending.reject(error);
        pendingPromiseRef.current = null;
        lastJobStateRef.current = null;
        setEnabled(false);
        return { phase: "error", error };
      }

      if (current.phase === "sign-swap") {
        if (last && "type" in last && last.type === "signed") {
          const broadcastIntent = createIntent(SWAP_POC_INTENT_DEFS.broadcast, {
            signedTxHex: last.signedTxHex,
            currencyId: pending.mainAccount.currency.id,
          });
          return {
            phase: "broadcast-swap",
            intent: broadcastIntent,
            deviceInitializationInput: current.deviceInitializationInput,
            approvalTxHash: current.approvalTxHash,
            swapSignedTxHex: last.signedTxHex,
          };
        }
        const error =
          last && "type" in last && last.type === "failed"
            ? last.error
            : new Error("Swap signing did not produce a signed transaction");
        pending.reject(error);
        pendingPromiseRef.current = null;
        lastJobStateRef.current = null;
        setEnabled(false);
        return { phase: "error", error };
      }

      if (current.phase === "broadcast-swap") {
        if (last && "type" in last && last.type === "confirmed") {
          // Hold the Promise until the user dismisses the swap-success
          // sheet — the swap transaction is already confirmed on-chain
          // at this point, the live app should always see both hashes.
          lastJobStateRef.current = null;
          return {
            phase: "swap-success",
            approvalTxHash: current.approvalTxHash,
            swapTxHash: last.hash,
          };
        }
        const error =
          last && "type" in last && last.type === "failed"
            ? last.error
            : new Error("Broadcast did not confirm the swap transaction");
        pending.reject(error);
        pendingPromiseRef.current = null;
        lastJobStateRef.current = null;
        setEnabled(false);
        return { phase: "error", error };
      }

      return current;
    });
  }, []);

  const handleJobError = useCallback(
    (err: unknown) => {
      // Job errors should never reach here because every intent surfaces
      // errors via `failed` job-state values, but we still want to fail
      // closed if the executor reports one.
      rejectAndReset(err instanceof Error ? err : new Error(String(err)));
    },
    [rejectAndReset],
  );

  const handleUserCancel = useCallback(() => {
    rejectAndReset(new DrawerClosedError("User closed the swap drawer"));
  }, [rejectAndReset]);

  /**
   * Resolves the held `customSwap` Promise with the approval hash only.
   * Triggered when the user closes the approval-success sheet via X or
   * backdrop instead of tapping the Swap CTA.
   */
  const handleApprovalOnlyDismiss = useCallback(() => {
    const pending = pendingPromiseRef.current;
    setPhase(current => {
      const result: CustomSwapResult =
        current.phase === "approval-success"
          ? { approvalTxHash: current.approvalTxHash }
          : {};
      pending?.resolve(result);
      return { phase: "idle" };
    });
    pendingPromiseRef.current = null;
    lastJobStateRef.current = null;
    setEnabled(false);
  }, []);

  /**
   * Triggered by the Swap CTA on the approval-success sheet. Transitions
   * to `build-swap` so the next effect can fetch DEX calldata and chain
   * the sign + broadcast intents in place.
   */
  const handleSwapPress = useCallback(() => {
    setPhase(current => {
      if (current.phase !== "approval-success") return current;
      return { phase: "build-swap", approvalTxHash: current.approvalTxHash };
    });
  }, []);

  /**
   * Resolves the held `customSwap` Promise with both the approval and
   * swap hashes once the user dismisses the swap-success sheet (Done
   * CTA, X or backdrop — all behave identically because the swap is
   * already on-chain).
   */
  const handleSwapSuccessDismiss = useCallback(() => {
    const pending = pendingPromiseRef.current;
    setPhase(current => {
      const result: CustomSwapResult =
        current.phase === "swap-success"
          ? {
              approvalTxHash: current.approvalTxHash,
              swapTxHash: current.swapTxHash,
            }
          : {};
      pending?.resolve(result);
      return { phase: "idle" };
    });
    pendingPromiseRef.current = null;
    lastJobStateRef.current = null;
    setEnabled(false);
  }, []);

  // Run the DEX build step asynchronously when the user opts into the
  // swap step. Once the calldata is back we transition into `sign-swap`
  // with a fresh intent instance; on failure we reject the Promise.
  useEffect(() => {
    if (phase.phase !== "build-swap") return;
    const pending = pendingPromiseRef.current;
    if (!pending) return;

    let cancelled = false;
    const plan = pending.swapPlan;
    if (!plan) {
      // Defensive — should be filtered upstream when the handler runs.
      rejectAndReset(
        new Error("custom.swap: missing DEX plan for the selected quote"),
      );
      return;
    }

    const approvalTxHash = phase.approvalTxHash;

    (async () => {
      try {
        const { transactionData } = await buildProviderTransactionData(
          plan.provider,
          plan.context,
        );
        if (cancelled) return;
        const swapIntent = createIntent(SWAP_POC_INTENT_DEFS.signSwap, {
          account: pending.mainAccount,
          transactionData: transactionData satisfies DexTransactionData,
          currencyId: pending.mainAccount.currency.id,
          derivationPath: pending.mainAccount.freshAddressPath,
        });
        setPhase({
          phase: "sign-swap",
          intent: swapIntent,
          deviceInitializationInput: ETHEREUM_INITIALIZATION_INPUT,
          approvalTxHash,
        });
      } catch (err) {
        if (cancelled) return;
        rejectAndReset(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, rejectAndReset]);

  const customSwapHandler = useCallback<
    SwapDeviceIntentPocOrchestrationResult["customSwapHandler"]
  >(
    request =>
      new Promise<CustomSwapResult>((resolve, reject) => {
        try {
          const params = request.params;
          if (!params) {
            reject(new Error("custom.swap: missing params"));
            return;
          }
          const tokenAllowance = params.quote.quoteDetails.tokenAllowance;
          if (!tokenAllowance || tokenAllowance.isApproved) {
            // Nothing to do — pass-through for the POC.
            resolve({});
            return;
          }
          if (!tokenAllowance.approvalTransaction) {
            reject(
              new Error(
                "custom.swap: quote requires approval but no approvalTransaction was provided",
              ),
            );
            return;
          }
          if (pendingPromiseRef.current) {
            reject(new Error("custom.swap: another swap flow is already running"));
            return;
          }

          const mainAccount = resolveEvmMainAccount(params.fromAccountId, accounts);
          const swapPlan = buildSwapPlan(params, mainAccount, accounts);

          pendingPromiseRef.current = {
            resolve,
            reject,
            mainAccount,
            swapPlan,
          };
          lastJobStateRef.current = null;

          const signIntent = createIntent(SWAP_POC_INTENT_DEFS.signApproval, {
            account: mainAccount,
            approvalTransaction: tokenAllowance.approvalTransaction,
            currencyId: mainAccount.currency.id,
            derivationPath: mainAccount.freshAddressPath,
          });

          setPhase({
            phase: "sign-approval",
            intent: signIntent,
            deviceInitializationInput: ETHEREUM_INITIALIZATION_INPUT,
          });
          setEnabled(true);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      }),
    [accounts],
  );

  const executorProps = useMemo<
    DeviceIntentExecutorProps<AnyJobState, AnyInput, AnyExtraProps, InitializationInput> | null
  >(() => {
    if (!enabled) return null;
    if (
      phase.phase !== "sign-approval" &&
      phase.phase !== "broadcast-approval" &&
      phase.phase !== "sign-swap" &&
      phase.phase !== "broadcast-swap"
    ) {
      return null;
    }

    return {
      enabled: true,
      deviceConnectionParams: DEFAULT_CONNECTION_PARAMS,
      deviceInitializationInput: phase.deviceInitializationInput,
      // The executor accepts a single Intent generic; we cast at the boundary
      // because each phase carries a strictly narrower instance.
      intent: phase.intent as unknown as Intent<AnyJobState, AnyInput, AnyExtraProps>, // eslint-disable-line @typescript-eslint/consistent-type-assertions
      intentComponentExtraProps: {} as AnyExtraProps, // eslint-disable-line @typescript-eslint/consistent-type-assertions
      onExecutorStateChanged: () => {
        /* no-op for the POC */
      },
      onIntentJobStateChanged: handleJobStateChanged,
      onIntentJobComplete: handleJobComplete,
      onIntentJobError: handleJobError,
      cancellableUI: true,
      cancelIntentRequestId: undefined,
      onUserCancel: handleUserCancel,
    };
  }, [
    enabled,
    phase,
    handleJobStateChanged,
    handleJobComplete,
    handleJobError,
    handleUserCancel,
  ]);

  const successScreen = useMemo<SwapPocSuccessScreen | null>(() => {
    if (phase.phase === "approval-success") {
      return {
        kind: "approval",
        approvalTxHash: phase.approvalTxHash,
        onSwapPress: handleSwapPress,
        onClose: handleApprovalOnlyDismiss,
      };
    }
    if (phase.phase === "swap-success") {
      return {
        kind: "swap",
        approvalTxHash: phase.approvalTxHash,
        swapTxHash: phase.swapTxHash,
        onDonePress: handleSwapSuccessDismiss,
        onClose: handleSwapSuccessDismiss,
      };
    }
    return null;
  }, [phase, handleSwapPress, handleApprovalOnlyDismiss, handleSwapSuccessDismiss]);

  return { customSwapHandler, executorProps, successScreen, enabled };
}
