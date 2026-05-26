# `swapFlow` — wallet-side swap-flow machine

Headless XState machine + flow planner that drives the wallet-side
`custom.swap` device-intent flow. The machine has no React, Lumen, or DMK
imports: hosts inject a [`SwapFlowPorts`](./types.ts) contract to bridge
intents and device-init payloads to their runtime.

The mobile (LWM) adapter lives in
[`apps/ledger-live-mobile/src/mvvm/features/SwapDeviceIntentPOC`](../../../../../../apps/ledger-live-mobile/src/mvvm/features/SwapDeviceIntentPOC).
This document sketches how a non-React host (CLI, scripts, tests) can
consume the same machine.

## Phase layout

```text
idle ─START──▶ signApproval ──▶ broadcastApproval ──▶ approvalSuccess
                                                       │
                                                       │ SWAP_PRESSED
                                                       ▼
                                                     buildSwap ──▶ signSwap ──▶ broadcastSwap ──▶ swapSuccess
                                                       │                                            │
                                                       │ APPROVAL_DISMISSED                         │ SWAP_DISMISSED
                                                       ▼                                            ▼
                                                  resolves with                              resolves with
                                                  { approvalTxHash }                         { approvalTxHash, swapTxHash }
```

`planSwapFlow()` decides which entry path the machine takes:

- `skip` — nothing for the wallet to do, resolves with `{}`.
- `approval-only` — sign + broadcast approval, resolves with the
  approval hash (used when the quote is non-DEX but needs an approval).
- `approval-then-swap` — full happy path with the user-gated success
  sheet between approval and swap.
- `direct-swap` — quote already approved on a wallet-driven DEX
  provider; starts at `buildSwap`, no approval gate.

Cancellations (drawer close, Ctrl-C, abort signal) send `CANCEL` and
reject the held promise with the supplied error.

## What the CLI needs to provide

A CLI adapter is a plain TypeScript module that:

1. Implements `SwapFlowPorts<TIntent, TInitInput>` with non-React intent
   runners. A CLI intent is just an object the host knows how to execute
   against a DMK transport — it does not need React components.
2. Builds a plan with `planSwapFlow(...)`.
3. Instantiates the machine with `createSwapFlowMachine(ports)`, calls
   `createActor(machine)` from `xstate`, and forwards events from the
   intent runner observables.
4. Resolves a Promise from the actor's terminal states using the
   `resolvers` carried in the START event.

There is **nothing else**: the planner, state graph, transitions, error
plumbing, and result shape are all reused as-is from the mobile adapter.

## Sketch: a CLI adapter

```ts
import { createActor } from "xstate";
import {
  createSwapFlowMachine,
  planSwapFlow,
  type SwapFlowPorts,
  type SwapFlowResolvers,
  type SwapFlowResult,
} from "@ledgerhq/live-common/wallet-api/Exchange/swapFlow/index";
import {
  buildProviderTransactionData,
  DEFAULT_DEX_GAS_LIMIT,
  DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
} from "@ledgerhq/live-common/wallet-api/Exchange/dex/index";
import type { Quote } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
import type { Account } from "@ledgerhq/types-live";

// The CLI's own intent shapes — pick whatever fits the runner. Could be
// "the function I call to sign / broadcast", e.g.
type CliIntent =
  | {
      kind: "sign-approval";
      run: (signal: AbortSignal) => Promise<{ signedTxHex: string }>;
    }
  | {
      kind: "sign-swap";
      run: (signal: AbortSignal) => Promise<{ signedTxHex: string }>;
    }
  | {
      kind: "broadcast";
      run: (signal: AbortSignal) => Promise<{ hash: string }>;
    };

// CLI hosts don't need device-init metadata; a `void`-ish marker works.
type CliInitInput = { appName: string };

const CLI_INIT_INPUT: CliInitInput = { appName: "Ethereum" };

function createCliPorts(deps: {
  signEvmApprovalOnDevice: (i: {
    account: Account;
    approvalTransaction: unknown;
  }) => Promise<{ signedTxHex: string }>;
  signEvmSwapOnDevice: (i: {
    account: Account;
    transactionData: unknown;
  }) => Promise<{ signedTxHex: string }>;
  broadcastEvmAndWaitForReceipt: (i: {
    signedTxHex: string;
    currencyId: string;
  }) => Promise<{ hash: string }>;
}): SwapFlowPorts<CliIntent, CliInitInput> {
  return {
    createSignApprovalIntent: ({ account, approvalTransaction }) => ({
      intent: {
        kind: "sign-approval",
        run: () => deps.signEvmApprovalOnDevice({ account, approvalTransaction }),
      },
      initInput: CLI_INIT_INPUT,
    }),
    createSignSwapIntent: ({ account, transactionData, hwAppId }) => ({
      intent: {
        kind: "sign-swap",
        run: () => deps.signEvmSwapOnDevice({ account, transactionData }),
      },
      // Open the partner's embedded app for the swap leg (Uniswap /
      // 1inch / Velora / Ethereum for OKX). Mobile reuses the same
      // init input for the follow-up broadcast so the device stays on
      // the partner app.
      initInput: { appName: hwAppId },
    }),
    createBroadcastIntent: ({ signedTxHex, currencyId, initInput }) => ({
      intent: {
        kind: "broadcast",
        run: () => deps.broadcastEvmAndWaitForReceipt({ signedTxHex, currencyId }),
      },
      // Carry the previous phase's init input through (matches the
      // device-intent self-transition rule on the LWM side).
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
}

export async function runCliSwap(args: {
  quote: Quote;
  mainAccount: Account;
  fromAccountId: string;
  toAccountId: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  ports: SwapFlowPorts<CliIntent, CliInitInput>;
  signal?: AbortSignal;
}): Promise<SwapFlowResult> {
  const machine = createSwapFlowMachine(args.ports);
  const actor = createActor(machine).start();

  const result = new Promise<SwapFlowResult>((resolve, reject) => {
    const resolvers: SwapFlowResolvers = { resolve, reject };

    const plan = planSwapFlow({
      quote: args.quote,
      fromAccountId: args.fromAccountId,
      toAccountId: args.toAccountId,
      fromAccountAddress: args.mainAccount.freshAddress,
      fromCurrencyId: args.fromCurrencyId,
      toCurrencyId: args.toCurrencyId,
      defaultGasLimit: DEFAULT_DEX_GAS_LIMIT,
      gasLimitMultiplier: DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
    });

    args.signal?.addEventListener("abort", () => {
      actor.send({ type: "CANCEL", error: new Error("Aborted by user") });
    });

    // Drive the running intent on every state change. On non-React hosts
    // the executor lifecycle that mobile gets for free has to be
    // implemented manually: pick up the new intent on `entry` of each
    // device phase and dispatch JOB_SIGNED / JOB_CONFIRMED / JOB_FAILED.
    const subscription = actor.subscribe(snapshot => {
      const phase = snapshot.value;
      const intent = snapshot.context.currentIntent;
      if (!intent) return;

      if (phase === "signApproval" || phase === "signSwap") {
        intent
          .run(new AbortController().signal)
          .then(({ signedTxHex }) =>
            actor.send({ type: "JOB_SIGNED", signedTxHex }),
          )
          .catch(err =>
            actor.send({
              type: "JOB_FAILED",
              error: err instanceof Error ? err : new Error(String(err)),
            }),
          );
      }

      if (phase === "broadcastApproval" || phase === "broadcastSwap") {
        intent
          .run(new AbortController().signal)
          .then(({ hash }) =>
            actor.send({ type: "JOB_CONFIRMED", hash }),
          )
          .catch(err =>
            actor.send({
              type: "JOB_FAILED",
              error: err instanceof Error ? err : new Error(String(err)),
            }),
          );
      }
    });

    // For a non-interactive CLI: auto-advance the optional approval gate
    // (no human in the loop to tap "Swap"). Skip this for an interactive
    // CLI that wants to prompt `[Y/n]` before the swap.
    const gateSubscription = actor.subscribe(snapshot => {
      if (snapshot.matches("approvalSuccess")) {
        actor.send({ type: "SWAP_PRESSED" });
      } else if (snapshot.matches("swapSuccess")) {
        actor.send({ type: "SWAP_DISMISSED" });
      }
    });

    actor.send({
      type: "START",
      input: {
        plan,
        mainAccount: args.mainAccount,
        currencyId: args.mainAccount.currency.id,
        derivationPath: args.mainAccount.freshAddressPath,
        initInput: CLI_INIT_INPUT,
        resolvers,
      },
    });

    result.finally(() => {
      subscription.unsubscribe();
      gateSubscription.unsubscribe();
      actor.stop();
    });
  });

  return result;
}
```

## Notes for CLI integrators

- **Idempotent intent runs.** The actor `subscribe` callback fires on
  every state change, so guard against starting the same intent twice
  (e.g. with a `WeakSet` of seen intents, or by caching `actor.getSnapshot().context.currentIntent`).
  The mobile adapter avoids this because the React executor mounts once
  per intent and forwards lifecycle events.
- **Approval gate.** `approvalSuccess` exists so an interactive UI can
  ask the user to confirm the swap. A non-interactive CLI can just send
  `SWAP_PRESSED` immediately, as shown above. Sending
  `APPROVAL_DISMISSED` short-circuits to the approval-only result.
- **Cancellation.** Wire your abort signal to a `CANCEL` event. The
  machine handles `CANCEL` in every non-terminal state and rejects the
  held promise.
- **Result shape.** The shared `SwapFlowResult` is currently
  `{ approvalTxHash?: string; swapTxHash?: string }`. Task 5 of the
  productionisation plan will tighten it into a discriminated union
  (`kind: "completed" | "approval-only" | …`); CLI consumers should
  treat the union as additive when it lands.
- **What's *not* in scope here.** Permit2, RFQ, USDT-revoke and non-EVM
  flows currently surface as `skip` plans. Wire the legacy swap pipeline
  ([`apps/wallet-cli/src/commands/swap/cli-swap-pipeline.ts`](../../../../../../apps/wallet-cli/src/commands/swap/cli-swap-pipeline.ts))
  for those until later tasks widen the planner.
