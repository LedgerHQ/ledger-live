import type { Account } from "@ledgerhq/types-live";
import { assign, fromPromise, setup } from "xstate";
import type { DexTransactionData } from "../dex";
import type {
  SignApprovalIntentInput,
  SignSwapIntentInput,
  SwapFlowPlan,
  SwapFlowPorts,
  SwapFlowResolvers,
  SwapFlowResult,
} from "./types";

/**
 * Headless XState machine that drives the wallet-side device-intent swap
 * flow. The machine is intentionally framework-agnostic: no React, no
 * Lumen, no DMK imports. Hosts inject {@link SwapFlowPorts} to bridge
 * intents/initInputs to their runtime, and consume the machine's state
 * to render a UI (mobile drawer, CLI status logger, etc.).
 *
 * Phase layout matches the live-app `_stepMachine` step vocabulary:
 * `approve_token` (sign + broadcast) → `swap` (build + sign + broadcast).
 * Permit2 / RFQ / revoke are out of scope for this task and surface as a
 * `skip` plan upstream.
 */
export type SwapFlowStartInput<TIntent, TInitInput> = {
  plan: SwapFlowPlan;
  mainAccount: Account;
  currencyId: string;
  derivationPath: string;
  /** Device-init payload reused for every device-bound phase. */
  initInput: TInitInput;
  resolvers: SwapFlowResolvers;
  /**
   * Forwarded to the host so it can re-issue the executor props (the
   * machine itself does not depend on this; we just keep it on context).
   */
  meta?: Record<string, unknown>;
  // Phantom marker so TInitInput contributes to the inferred input shape
  // even when `meta` is omitted; without it TS widens TInitInput to `unknown`.
  _phantom?: TIntent;
};

export type SwapFlowContext<TIntent, TInitInput> = {
  plan: SwapFlowPlan | null;
  mainAccount: Account | null;
  currencyId: string | null;
  derivationPath: string | null;
  defaultInitInput: TInitInput | null;
  resolvers: SwapFlowResolvers | null;
  /** Intent currently being run by the executor (`null` outside device phases). */
  currentIntent: TIntent | null;
  currentInitInput: TInitInput | null;
  /** Last signed-tx hex from a sign phase, consumed by the next broadcast. */
  signedTxHex: string | null;
  /** Hash of the broadcast-and-confirmed approval transaction. */
  approvalTxHash: string | null;
  /** Calldata produced by `buildSwapTransactionData` (consumed by `signSwap`). */
  swapBuildResult: DexTransactionData | null;
  /** Hash of the broadcast-and-confirmed swap transaction. */
  swapTxHash: string | null;
  error: Error | null;
};

export type SwapFlowEvent<TIntent, TInitInput> =
  | { type: "START"; input: SwapFlowStartInput<TIntent, TInitInput> }
  | { type: "JOB_SIGNED"; signedTxHex: string }
  | { type: "JOB_CONFIRMED"; hash: string }
  | { type: "JOB_FAILED"; error: Error }
  | { type: "JOB_ERROR"; error: Error }
  | { type: "SWAP_PRESSED" }
  | { type: "APPROVAL_DISMISSED" }
  | { type: "SWAP_DISMISSED" }
  | { type: "CANCEL"; error?: Error };

type BuildSwapInput = {
  provider: Extract<
    SwapFlowPlan,
    { kind: "approval-then-swap" | "direct-swap" }
  >["provider"];
  buildContext: Extract<
    SwapFlowPlan,
    { kind: "approval-then-swap" | "direct-swap" }
  >["buildContext"];
};

function initialContext<TIntent, TInitInput>(): SwapFlowContext<
  TIntent,
  TInitInput
> {
  return {
    plan: null,
    mainAccount: null,
    currencyId: null,
    derivationPath: null,
    defaultInitInput: null,
    resolvers: null,
    currentIntent: null,
    currentInitInput: null,
    signedTxHex: null,
    approvalTxHash: null,
    swapBuildResult: null,
    swapTxHash: null,
    error: null,
  };
}

/**
 * Build an XState machine for the swap flow. The returned value is a
 * fully-typed v5 machine ready to be passed to `useMachine` (mobile) or
 * `createActor` (CLI / tests).
 */
export function createSwapFlowMachine<TIntent, TInitInput>(
  ports: SwapFlowPorts<TIntent, TInitInput>,
) {
  type Ctx = SwapFlowContext<TIntent, TInitInput>;
  type Evt = SwapFlowEvent<TIntent, TInitInput>;

  return setup({
    types: {
      context: {} as Ctx,
      events: {} as Evt,
    },
    actors: {
      buildSwap: fromPromise(
        async ({ input }: { input: BuildSwapInput }) => {
          return ports.buildSwapTransactionData({
            provider: input.provider,
            context: input.buildContext,
          });
        },
      ),
    },
    actions: {
      acceptStart: assign(({ event }) => {
        if (event.type !== "START") return {};
        const { input } = event;
        return {
          plan: input.plan,
          mainAccount: input.mainAccount,
          currencyId: input.currencyId,
          derivationPath: input.derivationPath,
          defaultInitInput: input.initInput,
          resolvers: input.resolvers,
          currentIntent: null,
          currentInitInput: null,
          signedTxHex: null,
          approvalTxHash: null,
          swapBuildResult: null,
          swapTxHash: null,
          error: null,
        };
      }),
      buildSignApprovalIntent: assign(({ context }) => {
        const plan = context.plan;
        if (
          !plan ||
          (plan.kind !== "approval-only" && plan.kind !== "approval-then-swap")
        ) {
          return {};
        }
        const account = context.mainAccount;
        const currencyId = context.currencyId;
        const derivationPath = context.derivationPath;
        if (!account || !currencyId || !derivationPath) return {};
        const portInput: SignApprovalIntentInput = {
          account,
          approvalTransaction: plan.approvalTransaction,
          currencyId,
          derivationPath,
        };
        const { intent, initInput } = ports.createSignApprovalIntent(portInput);
        return { currentIntent: intent, currentInitInput: initInput };
      }),
      buildBroadcastIntent: assign(({ context }) => {
        const signedTxHex = context.signedTxHex;
        const currencyId = context.currencyId;
        // Carry the previous phase's initInput to keep the executor on a
        // self-transition (see device-intent README).
        const initInput = context.currentInitInput ?? context.defaultInitInput;
        if (!signedTxHex || !currencyId || !initInput) return {};
        const { intent, initInput: nextInitInput } = ports.createBroadcastIntent({
          signedTxHex,
          currencyId,
          initInput,
        });
        return { currentIntent: intent, currentInitInput: nextInitInput };
      }),
      buildSignSwapIntent: assign(({ context }) => {
        const account = context.mainAccount;
        const currencyId = context.currencyId;
        const derivationPath = context.derivationPath;
        const transactionData = context.swapBuildResult;
        if (!account || !currencyId || !derivationPath || !transactionData) {
          return {};
        }
        const portInput: SignSwapIntentInput = {
          account,
          transactionData,
          currencyId,
          derivationPath,
        };
        const { intent, initInput } = ports.createSignSwapIntent(portInput);
        return { currentIntent: intent, currentInitInput: initInput };
      }),
      storeSignedTxHex: assign(({ event }) => {
        if (event.type !== "JOB_SIGNED") return {};
        return { signedTxHex: event.signedTxHex };
      }),
      storeApprovalHash: assign(({ event }) => {
        if (event.type !== "JOB_CONFIRMED") return {};
        return { approvalTxHash: event.hash, currentIntent: null };
      }),
      storeSwapHash: assign(({ event }) => {
        if (event.type !== "JOB_CONFIRMED") return {};
        return { swapTxHash: event.hash, currentIntent: null };
      }),
      clearCurrentIntent: assign({
        currentIntent: () => null,
      }),
      storeJobError: assign(({ event }) => {
        if (event.type === "JOB_FAILED" || event.type === "JOB_ERROR") {
          return { error: event.error };
        }
        return {};
      }),
      storeCancelError: assign(({ event }) => {
        if (event.type !== "CANCEL") return {};
        return {
          error:
            event.error ??
            new Error("Swap flow cancelled by user"),
        };
      }),
      resolveSkip: ({ context }) => {
        context.resolvers?.resolve({});
      },
      resolveWithApprovalOnly: ({ context }) => {
        const result: SwapFlowResult = context.approvalTxHash
          ? { approvalTxHash: context.approvalTxHash }
          : {};
        context.resolvers?.resolve(result);
      },
      resolveWithCompletedSwap: ({ context }) => {
        const result: SwapFlowResult = {};
        if (context.approvalTxHash) result.approvalTxHash = context.approvalTxHash;
        if (context.swapTxHash) result.swapTxHash = context.swapTxHash;
        context.resolvers?.resolve(result);
      },
      rejectWithError: ({ context }) => {
        const err = context.error ?? new Error("Swap flow failed");
        context.resolvers?.reject(err);
      },
      clearRunState: assign(() => initialContext<TIntent, TInitInput>()),
    },
    guards: {
      planIsSkip: ({ context, event }) => {
        if (event.type !== "START") return context.plan?.kind === "skip";
        return event.input.plan.kind === "skip";
      },
      planNeedsApproval: ({ event }) => {
        if (event.type !== "START") return false;
        const k = event.input.plan.kind;
        return k === "approval-only" || k === "approval-then-swap";
      },
      planIsDirectSwap: ({ event }) => {
        if (event.type !== "START") return false;
        return event.input.plan.kind === "direct-swap";
      },
      planEndsAtApproval: ({ context }) =>
        context.plan?.kind === "approval-only",
      planContinuesToSwap: ({ context }) =>
        context.plan?.kind === "approval-then-swap",
    },
  }).createMachine({
    id: "swapFlow",
    initial: "idle",
    context: initialContext<TIntent, TInitInput>(),
    states: {
      idle: {
        on: {
          START: [
            {
              guard: "planIsSkip",
              target: "resolvingSkip",
              actions: "acceptStart",
            },
            {
              guard: "planNeedsApproval",
              target: "signApproval",
              actions: "acceptStart",
            },
            {
              guard: "planIsDirectSwap",
              target: "buildSwap",
              actions: "acceptStart",
            },
          ],
        },
      },

      signApproval: {
        entry: "buildSignApprovalIntent",
        on: {
          JOB_SIGNED: {
            target: "broadcastApproval",
            actions: "storeSignedTxHex",
          },
          JOB_FAILED: { target: "failed", actions: "storeJobError" },
          JOB_ERROR: { target: "failed", actions: "storeJobError" },
          CANCEL: { target: "cancelled", actions: "storeCancelError" },
        },
      },

      broadcastApproval: {
        entry: "buildBroadcastIntent",
        on: {
          JOB_CONFIRMED: [
            {
              guard: "planEndsAtApproval",
              target: "resolvingApprovalOnly",
              actions: "storeApprovalHash",
            },
            {
              guard: "planContinuesToSwap",
              target: "approvalSuccess",
              actions: "storeApprovalHash",
            },
          ],
          JOB_FAILED: { target: "failed", actions: "storeJobError" },
          JOB_ERROR: { target: "failed", actions: "storeJobError" },
          CANCEL: { target: "cancelled", actions: "storeCancelError" },
        },
      },

      approvalSuccess: {
        on: {
          SWAP_PRESSED: { target: "buildSwap" },
          APPROVAL_DISMISSED: { target: "resolvingApprovalOnly" },
          CANCEL: { target: "cancelled", actions: "storeCancelError" },
        },
      },

      buildSwap: {
        invoke: {
          id: "buildSwap",
          src: "buildSwap",
          input: ({ context }) => {
            const plan = context.plan;
            if (
              !plan ||
              (plan.kind !== "approval-then-swap" && plan.kind !== "direct-swap")
            ) {
              throw new Error(
                "buildSwap actor invoked with an incompatible plan",
              );
            }
            return { provider: plan.provider, buildContext: plan.buildContext };
          },
          // Inline assign actions on onDone/onError. The runtime event types
          // (`xstate.done.actor.buildSwap` / `xstate.error.actor.buildSwap`)
          // depend on the actor id and TS narrowing in setup() does not
          // expose them on the named action table, so reading
          // `event.output` / `event.error` here is the safe path.
          onDone: {
            target: "signSwap",
            actions: assign({
              swapBuildResult: ({ event }) => event.output as DexTransactionData,
            }),
          },
          onError: {
            target: "failed",
            actions: assign({
              error: ({ event }) =>
                event.error instanceof Error
                  ? event.error
                  : new Error(String(event.error ?? "buildSwap failed")),
            }),
          },
        },
        on: {
          CANCEL: { target: "cancelled", actions: "storeCancelError" },
        },
      },

      signSwap: {
        entry: "buildSignSwapIntent",
        on: {
          JOB_SIGNED: {
            target: "broadcastSwap",
            actions: "storeSignedTxHex",
          },
          JOB_FAILED: { target: "failed", actions: "storeJobError" },
          JOB_ERROR: { target: "failed", actions: "storeJobError" },
          CANCEL: { target: "cancelled", actions: "storeCancelError" },
        },
      },

      broadcastSwap: {
        entry: "buildBroadcastIntent",
        on: {
          JOB_CONFIRMED: {
            target: "swapSuccess",
            actions: "storeSwapHash",
          },
          JOB_FAILED: { target: "failed", actions: "storeJobError" },
          JOB_ERROR: { target: "failed", actions: "storeJobError" },
          CANCEL: { target: "cancelled", actions: "storeCancelError" },
        },
      },

      swapSuccess: {
        on: {
          SWAP_DISMISSED: { target: "resolvingCompleted" },
          CANCEL: { target: "cancelled", actions: "storeCancelError" },
        },
      },

      resolvingSkip: {
        entry: ["resolveSkip", "clearRunState"],
        always: { target: "idle" },
      },

      resolvingApprovalOnly: {
        entry: ["resolveWithApprovalOnly", "clearRunState"],
        always: { target: "idle" },
      },

      resolvingCompleted: {
        entry: ["resolveWithCompletedSwap", "clearRunState"],
        always: { target: "idle" },
      },

      failed: {
        entry: ["rejectWithError", "clearRunState"],
        always: { target: "idle" },
      },

      cancelled: {
        entry: ["rejectWithError", "clearRunState"],
        always: { target: "idle" },
      },
    },
  });
}

export type SwapFlowMachine<TIntent, TInitInput> = ReturnType<
  typeof createSwapFlowMachine<TIntent, TInitInput>
>;
