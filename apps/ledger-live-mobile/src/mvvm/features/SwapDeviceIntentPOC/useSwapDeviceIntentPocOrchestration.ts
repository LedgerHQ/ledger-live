import { useMachine } from "@xstate/react";
import { useCallback, useMemo } from "react";
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
} from "@ledgerhq/live-common/wallet-api/Exchange/dex/index";
import {
  createSwapFlowMachine,
  planSwapFlow,
  type SwapFlowPorts,
  type SwapFlowResolvers,
} from "@ledgerhq/live-common/wallet-api/Exchange/swapFlow/index";
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
  SignPermit2EvmIntent,
  SignPermit2EvmIntentInput,
  SignPermit2EvmJobState,
} from "./intents/signPermit2EvmIntent/types";
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

/**
 * Build the device-init input for the swap leg using the partner's
 * hardware-wallet app id surfaced by `buildProviderTransactionData()`
 * ("Uniswap" / "1inch" / "Velora" / "Ethereum" for OKX). The subsequent
 * broadcast phase reuses this same input so the device stays on the
 * partner app instead of returning to the Ethereum app.
 */
function buildSwapInitializationInput(hwAppId: string): InitializationInput {
  return {
    appName: hwAppId,
    dependencies: [],
    requireLatestFirmware: false,
    allowPartialDependencies: false,
  };
}

// Every POC intent emits through the same executor, so the executor props are
// typed as the broadest union of their job states and inputs. Each phase
// keeps the precise Intent instance internally and we cast at the boundary.
type AnyJobState =
  | SignApprovalEvmJobState
  | SignSwapEvmJobState
  | SignPermit2EvmJobState
  | BroadcastEvmJobState;
type AnyInput =
  | SignApprovalEvmIntentInput
  | SignSwapEvmIntentInput
  | SignPermit2EvmIntentInput
  | BroadcastEvmIntentInput;
type AnyExtraProps = Record<string, never>;
type AnyIntent =
  | SignApprovalEvmIntent
  | SignSwapEvmIntent
  | SignPermit2EvmIntent
  | BroadcastEvmIntent;

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
      /**
       * Next on-device step the primary CTA will trigger. Mirrors the
       * swap-live-app `useSwapLabels` ordering (approve → sign_permit →
       * swap) so the button copy matches what tapping it actually does:
       * for an `approval-then-permit-then-swap` plan the next step is
       * the Permit2 typed-data signature, not the swap calldata sign.
       */
      nextStep: "permit" | "swap";
      /** Hash of the broadcast-and-confirmed approval transaction. */
      approvalTxHash: string;
      /** Called when the user taps the primary CTA (kicks off the next step). */
      onPrimaryPress: () => void;
      /** Called when the user dismisses the sheet (X or backdrop) — resolves with approval only. */
      onClose: () => void;
    }
  | {
      kind: "swap";
      /** Hash of the broadcast-and-confirmed approval transaction (null for direct swaps). */
      approvalTxHash: string | null;
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
  /**
   * Always-available cancel callback the host should fire on drawer
   * close when neither {@link executorProps} nor {@link successScreen}
   * is set (e.g. during the asynchronous `buildSwap` phase). Sends the
   * machine a `CANCEL` event so the held `customSwap` Promise rejects
   * and the machine resets to `idle` for the next call.
   */
  onUserCancel: () => void;
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
 * LWM port factories: build {@link Intent} runtime instances for the
 * shared `swapFlow` machine. Stateless and side-effect-free at module
 * scope so we can memo a single ports object per render.
 */
const LWM_SWAP_FLOW_PORTS: SwapFlowPorts<AnyIntent, InitializationInput> = {
  createSignApprovalIntent: ({ account, approvalTransaction, currencyId, derivationPath }) => ({
    intent: createIntent(SWAP_POC_INTENT_DEFS.signApproval, {
      account,
      approvalTransaction,
      currencyId,
      derivationPath,
    }),
    initInput: ETHEREUM_INITIALIZATION_INPUT,
  }),
  createSignSwapIntent: ({ account, transactionData, currencyId, derivationPath, hwAppId }) => ({
    intent: createIntent(SWAP_POC_INTENT_DEFS.signSwap, {
      account,
      transactionData,
      currencyId,
      derivationPath,
    }),
    // Open the partner's embedded app for the swap leg. The follow-up
    // broadcast phase carries the same init input forward so it absorbs
    // the intent change as a self-transition (see device-intent README).
    initInput: buildSwapInitializationInput(hwAppId),
  }),
  createSignPermit2Intent: ({ account, typedData, currencyId, derivationPath }) => ({
    intent: createIntent(SWAP_POC_INTENT_DEFS.signPermit2, {
      account,
      typedData,
      currencyId,
      derivationPath,
    }),
    initInput: ETHEREUM_INITIALIZATION_INPUT,
  }),
  createBroadcastIntent: ({ signedTxHex, currencyId, initInput }) => ({
    intent: createIntent(SWAP_POC_INTENT_DEFS.broadcast, { signedTxHex, currencyId }),
    // Re-use the previous phase's init input so the executor absorbs the
    // intent change as a self-transition (see device-intent README).
    initInput,
  }),
  buildSwapTransactionData: async ({ provider, context }) => {
    const { transactionData, hwAppId } = await buildProviderTransactionData(
      provider,
      context,
    );
    return { transactionData, hwAppId };
  },
};

const SWAP_FLOW_MACHINE = createSwapFlowMachine(LWM_SWAP_FLOW_PORTS);

/**
 * Adapter hook around the shared {@link createSwapFlowMachine} machine.
 *
 * - Resolves wallet-API account ids to wallet-side `Account`s and builds a
 *   {@link planSwapFlow} plan (already-approved DEX quotes now go through
 *   a wallet-driven direct-swap path instead of the previous `{}`
 *   short-circuit).
 * - Translates `DeviceIntentExecutor` lifecycle callbacks into typed
 *   machine events (`JOB_SIGNED`, `JOB_CONFIRMED`, `JOB_FAILED`,
 *   `JOB_ERROR`, `CANCEL`).
 * - Derives `executorProps` and `successScreen` from the machine state so
 *   the host stays a thin renderer.
 */
export function useSwapDeviceIntentPocOrchestration({
  accounts,
}: {
  accounts: AccountLike[];
}): SwapDeviceIntentPocOrchestrationResult {
  // `actorRef` is stable across renders so we can read the live snapshot
  // inside callbacks instead of capturing potentially stale `state` from
  // the React render. `state` is still used for derivations that need to
  // re-render the host (executor / success-screen visibility).
  const [state, send, actorRef] = useMachine(SWAP_FLOW_MACHINE);

  const handleJobStateChanged = useCallback(
    (jobState: AnyJobState) => {
      if (!("type" in jobState)) return;
      switch (jobState.type) {
        case "signed":
          // Sign-approval / sign-swap jobs emit `signedTxHex`; the
          // Permit2 job emits `signatureHex`. Discriminate on the
          // payload shape so the host doesn't need to know which phase
          // is currently active.
          if ("signedTxHex" in jobState) {
            send({ type: "JOB_SIGNED", signedTxHex: jobState.signedTxHex });
          } else if ("signatureHex" in jobState) {
            send({ type: "JOB_PERMIT_SIGNED", signatureHex: jobState.signatureHex });
          }
          break;
        case "confirmed":
          send({ type: "JOB_CONFIRMED", hash: jobState.hash });
          break;
        case "failed":
          send({ type: "JOB_FAILED", error: jobState.error });
          break;
        default:
          break;
      }
    },
    [send],
  );

  const handleJobComplete = useCallback(() => {
    // Job completion is implied by the terminal events forwarded above
    // (`JOB_SIGNED`, `JOB_CONFIRMED`, `JOB_FAILED`); intentionally a no-op.
  }, []);

  const handleJobError = useCallback(
    (err: unknown) => {
      send({
        type: "JOB_ERROR",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    },
    [send],
  );

  const handleUserCancel = useCallback(() => {
    send({
      type: "CANCEL",
      error: new DrawerClosedError("User closed the swap drawer"),
    });
  }, [send]);

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
          // Live snapshot — `state` from the closure may be stale if the
          // live-app holds an old handler reference between renders.
          if (!actorRef.getSnapshot().matches("idle")) {
            reject(new Error("custom.swap: another swap flow is already running"));
            return;
          }

          const mainAccount = resolveEvmMainAccount(params.fromAccountId, accounts);
          const plan = planSwapFlow({
            quote: params.quote,
            fromAccountId: params.fromAccountId,
            toAccountId: params.toAccountId,
            fromAccountAddress: mainAccount.freshAddress,
            fromCurrencyId: resolveCurrencyId(params.fromAccountId, accounts),
            toCurrencyId: resolveCurrencyId(params.toAccountId, accounts),
            defaultGasLimit: DEFAULT_DEX_GAS_LIMIT,
            gasLimitMultiplier: DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
          });

          const resolvers: SwapFlowResolvers = { resolve, reject };

          send({
            type: "START",
            input: {
              plan,
              mainAccount,
              currencyId: mainAccount.currency.id,
              derivationPath: mainAccount.freshAddressPath,
              initInput: ETHEREUM_INITIALIZATION_INPUT,
              resolvers,
            },
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      }),
    [accounts, actorRef, send],
  );

  const enabled = !state.matches("idle");

  const executorProps = useMemo<
    DeviceIntentExecutorProps<AnyJobState, AnyInput, AnyExtraProps, InitializationInput> | null
  >(() => {
    const isDevicePhase =
      state.matches("signApproval") ||
      state.matches("broadcastApproval") ||
      state.matches("signPermit2") ||
      state.matches("signSwap") ||
      state.matches("broadcastSwap");
    if (!isDevicePhase) return null;
    const { currentIntent, currentInitInput } = state.context;
    if (!currentIntent || !currentInitInput) return null;

    return {
      enabled: true,
      deviceConnectionParams: DEFAULT_CONNECTION_PARAMS,
      deviceInitializationInput: currentInitInput,
      // The executor accepts a single Intent generic; we cast at the boundary
      // because each phase carries a strictly narrower instance.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      intent: currentIntent as unknown as Intent<AnyJobState, AnyInput, AnyExtraProps>,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      intentComponentExtraProps: {} as AnyExtraProps,
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
  }, [state, handleJobStateChanged, handleJobComplete, handleJobError, handleUserCancel]);

  const successScreen = useMemo<SwapPocSuccessScreen | null>(() => {
    if (state.matches("approvalSuccess") && state.context.approvalTxHash) {
      // The machine already routes `SWAP_PRESSED` to `signPermit2` vs
      // `buildSwap` via `planContinuesToPermit`; we mirror that decision
      // here so the host can label the CTA after the actual next phase.
      const nextStep =
        state.context.plan?.kind === "approval-then-permit-then-swap"
          ? "permit"
          : "swap";
      return {
        kind: "approval",
        nextStep,
        approvalTxHash: state.context.approvalTxHash,
        onPrimaryPress: () => send({ type: "SWAP_PRESSED" }),
        onClose: () => send({ type: "APPROVAL_DISMISSED" }),
      };
    }
    if (state.matches("swapSuccess") && state.context.swapTxHash) {
      const dismiss = () => send({ type: "SWAP_DISMISSED" });
      return {
        kind: "swap",
        approvalTxHash: state.context.approvalTxHash,
        swapTxHash: state.context.swapTxHash,
        onDonePress: dismiss,
        onClose: dismiss,
      };
    }
    return null;
  }, [state, send]);

  return {
    customSwapHandler,
    executorProps,
    successScreen,
    enabled,
    onUserCancel: handleUserCancel,
  };
}
