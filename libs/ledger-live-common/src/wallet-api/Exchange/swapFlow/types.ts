import type { Account } from "@ledgerhq/types-live";
import type {
  CustomSwapResult,
  Quote,
  QuoteApprovalTransaction,
} from "../quotes/types";
import type {
  DexBuildContext,
  DexProvider,
  DexTransactionData,
} from "../dex";

/**
 * Plan produced by {@link planSwapFlow}: tells the machine which sub-paths
 * to walk for the given quote. The shape matches the live-app
 * `_stepMachine` semantics (`approve_token` → `swap`) but mapped onto the
 * wallet-side device-intent phases we can drive today.
 */
export type SwapFlowPlan =
  | {
      /**
       * Nothing for the wallet to do (no approval needed and the quote is
       * not a wallet-driven DEX execution). The caller is expected to fall
       * back to its legacy execution path.
       */
      kind: "skip";
      reason: "no-approval-non-dex" | "already-approved-non-dex";
    }
  | {
      /**
       * Approval required, but the quote does not target a wallet-driven
       * DEX provider. We sign + broadcast the approval and resolve.
       */
      kind: "approval-only";
      approvalTransaction: QuoteApprovalTransaction;
    }
  | {
      /**
       * Standard 2-step flow: approve_token → swap (no Permit2, no RFQ).
       * The user gates the swap step by tapping the approval-success CTA.
       */
      kind: "approval-then-swap";
      approvalTransaction: QuoteApprovalTransaction;
      provider: DexProvider;
      buildContext: DexBuildContext;
    }
  | {
      /**
       * Approval already satisfied AND the quote targets a wallet-driven
       * DEX provider: skip the approval branch and run the swap step
       * directly. Replaces the previous "resolve `{}`" short-circuit.
       */
      kind: "direct-swap";
      provider: DexProvider;
      buildContext: DexBuildContext;
    };

/**
 * Inputs accepted by {@link planSwapFlow}. Pre-resolved so the planner
 * itself remains pure (no `accounts: AccountLike[]` lookup).
 */
export type PlanSwapFlowInput = {
  quote: Quote;
  /** Wallet-API account ids (used for currency id resolution by the caller). */
  fromAccountId: string;
  toAccountId: string;
  /** EVM main account address that signs the approval and the swap. */
  fromAccountAddress: string;
  /** Crypto-currency or token id of the send account, when resolvable. */
  fromCurrencyId: string | undefined;
  /** Crypto-currency or token id of the receive account, when resolvable. */
  toCurrencyId: string | undefined;
  /** Default DEX gas-limit fallback applied when the provider omits one. */
  defaultGasLimit: string;
  /** DEX gas-limit safety multiplier (`buildSwapPlan()` callers know it). */
  gasLimitMultiplier: number;
};

/**
 * Final result the host promises to the live-app. Keeps the existing
 * `CustomSwapResult` shape for now; Task 5 will tighten it into a
 * discriminated union (e.g. `kind: "completed" | "approval-only" | ...`).
 */
export type SwapFlowResult = CustomSwapResult;

/**
 * Success-screen descriptor surfaced by the machine for hosts that render
 * a confirmation sheet between phases. The host is expected to call
 * `onSwapPress` / `onClose` / `onDonePress` to advance the machine.
 */
export type SwapFlowSuccessScreen =
  | {
      kind: "approval";
      approvalTxHash: string;
      onSwapPress: () => void;
      onClose: () => void;
    }
  | {
      kind: "swap";
      approvalTxHash: string | null;
      swapTxHash: string;
      onDonePress: () => void;
      onClose: () => void;
    };

/**
 * Inputs passed to the port factories (`createSign{Approval,Swap}Intent`,
 * `createBroadcastIntent`). Kept in one place so adapters can build their
 * `SwapFlowPorts` once and reuse them across calls.
 */
export type SignApprovalIntentInput = {
  account: Account;
  approvalTransaction: QuoteApprovalTransaction;
  currencyId: string;
  derivationPath: string;
};

export type SignSwapIntentInput = {
  account: Account;
  transactionData: DexTransactionData;
  currencyId: string;
  derivationPath: string;
};

export type BroadcastIntentInput = {
  signedTxHex: string;
  currencyId: string;
};

/**
 * Cross-platform contract injected into {@link createSwapFlowMachine}.
 *
 * Generic over `TIntent` (host-specific intent runtime instance, e.g. an
 * LWM `Intent` carrying a React component, or a CLI intent runner) and
 * `TInitInput` (host-specific device-initialisation payload). Using
 * generics keeps the machine free of React / Lumen / DMK imports — the
 * mobile adapter binds them to LWM types, a CLI adapter would bind them
 * to its own runtime types.
 */
export type SwapFlowPorts<TIntent, TInitInput> = {
  /** Build a sign-approval intent runtime instance + matching device init payload. */
  createSignApprovalIntent: (input: SignApprovalIntentInput) => {
    intent: TIntent;
    initInput: TInitInput;
  };
  /** Build a sign-swap intent runtime instance + matching device init payload. */
  createSignSwapIntent: (input: SignSwapIntentInput) => {
    intent: TIntent;
    initInput: TInitInput;
  };
  /**
   * Build a broadcast intent runtime instance. The machine forwards the
   * `initInput` from the previous phase so the executor absorbs the
   * intent change as a self-transition (see device-intent README).
   */
  createBroadcastIntent: (
    input: BroadcastIntentInput & { initInput: TInitInput },
  ) => { intent: TIntent; initInput: TInitInput };
  /** Async fetch of provider calldata (`buildProviderTransactionData`). */
  buildSwapTransactionData: (input: {
    provider: DexProvider;
    context: DexBuildContext;
  }) => Promise<DexTransactionData>;
};

/**
 * Promise-bridge callbacks stored in the machine context. The host calls
 * `START` with a fresh pair on every `custom.swap` request; the machine
 * invokes them on terminal states.
 */
export type SwapFlowResolvers = {
  resolve: (result: SwapFlowResult) => void;
  reject: (error: Error) => void;
};

/**
 * Snapshot the host needs to render the executor (`null` when the machine
 * is idle or awaiting user input on a success sheet).
 */
export type SwapFlowExecutorSnapshot<TIntent, TInitInput> = {
  intent: TIntent;
  initInput: TInitInput;
  /** Which phase is currently active — useful for telemetry/logging. */
  phase:
    | "sign-approval"
    | "broadcast-approval"
    | "sign-swap"
    | "broadcast-swap";
};
