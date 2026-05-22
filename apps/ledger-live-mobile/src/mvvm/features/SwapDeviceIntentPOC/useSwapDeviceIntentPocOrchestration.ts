import { useCallback, useMemo, useRef, useState } from "react";
import {
  createIntent,
  type DeviceConnectionParams,
  type DeviceIntentExecutorProps,
  type Intent,
} from "@ledgerhq/device-intent";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/index";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { AccountLike } from "@ledgerhq/types-live";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import { SWAP_POC_INTENT_DEFS } from "./intents/registry";
import type {
  SignApprovalEvmIntent,
  SignApprovalEvmIntentInput,
  SignApprovalEvmJobState,
} from "./intents/signApprovalEvmIntent/types";
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

// Both POC intents emit through the same executor, so the executor props are
// typed as the broadest union of their job states and inputs. Each phase
// keeps the precise Intent instance internally and we cast at the boundary.
type AnyJobState = SignApprovalEvmJobState | BroadcastEvmJobState;
type AnyInput = SignApprovalEvmIntentInput | BroadcastEvmIntentInput;
type AnyExtraProps = Record<string, never>;

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
  | { phase: "done"; approvalTxHash: string }
  | { phase: "error"; error: Error };

type PendingPromise = {
  resolve: (value: CustomSwapResult) => void;
  reject: (error: Error) => void;
  derivationPath: string;
  currencyId: string;
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
  /** Whether the executor should be visible / active. */
  enabled: boolean;
};

/**
 * Resolves the wallet API account id to the parent EVM account that owns the
 * spending allowance. The handler accepts either a token sub-account id or
 * a main account id; we always sign from the main account and use its
 * `freshAddressPath`.
 */
function resolveEvmMainAccount(
  walletAccountId: string,
  accounts: AccountLike[],
): { account: AccountLike; mainAccountId: string; derivationPath: string; currencyId: string } {
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
    throw new Error(`custom.swap POC supports EVM source accounts only (got ${main.currency.family})`);
  }
  return {
    account,
    mainAccountId: main.id,
    derivationPath: main.freshAddressPath,
    currencyId: main.currency.id,
  };
}

/**
 * Orchestrates the approval-only swap POC.
 *
 * The hook exposes a `custom.swap`-compatible handler and the props needed to
 * mount {@link DeviceIntentExecutorLWM} alongside the swap webview. Phase
 * transitions follow the device-intent README contract: we react to
 * `onIntentJobComplete` (never `onIntentJobStateChanged`), keep `intent` and
 * `deviceInitializationInput` in the same state update, and create fresh
 * Intent instances via {@link createIntent} on every transition.
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
            currencyId: pending.currencyId,
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
          pending.resolve({ approvalTxHash: last.hash });
          pendingPromiseRef.current = null;
          lastJobStateRef.current = null;
          setEnabled(false);
          return { phase: "done", approvalTxHash: last.hash };
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

          const { derivationPath, currencyId } = resolveEvmMainAccount(
            params.fromAccountId,
            accounts,
          );

          pendingPromiseRef.current = {
            resolve,
            reject,
            derivationPath,
            currencyId,
          };
          lastJobStateRef.current = null;

          const signIntent = createIntent(SWAP_POC_INTENT_DEFS.signApproval, {
            derivationPath,
            currencyId,
            approvalTransaction: tokenAllowance.approvalTransaction,
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
    if (phase.phase !== "sign-approval" && phase.phase !== "broadcast-approval") return null;

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

  return { customSwapHandler, executorProps, enabled };
}
