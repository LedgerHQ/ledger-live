import type { Account, EIP712Message } from "@ledgerhq/types-live";
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
import type { RfqProvider } from "../intents/signRfqOrderEvm/rfqTypedData";

/**
 * Plan produced by {@link planSwapFlow}: tells the machine which sub-paths
 * to walk for the given quote. The shape matches the live-app
 * `_stepMachine` semantics (`approve_token` → `swap`) but mapped onto the
 * wallet-side device-intent phases we can drive today.
 */
export type SwapFlowPlan =
  | {
      /**
       * Nothing for the wallet to do. The caller is expected to fall
       * back to its legacy execution path.
       *
       * - `no-approval-non-dex` / `already-approved-non-dex`: quote
       *   targets a non-DEX provider that the wallet can't drive.
       * - `rfq-not-supported`: UniswapX / 1inch-Fusion / Velora-Fusion
       *   quotes need an off-chain order signing path that the wallet
       *   doesn't yet implement (Task 8 Shape B).
       * - `dex-approval-blob-missing`: DEX quote that says it needs a
       *   token approval but did not ship the matching transaction blob;
       *   we refuse to silently downgrade to a direct swap.
       */
      kind: "skip";
      reason:
        | "no-approval-non-dex"
        | "already-approved-non-dex"
        | "rfq-not-supported"
        | "rfq-typed-data-missing"
        | "dex-approval-blob-missing";
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
    }
  | {
      /**
       * Approval already satisfied, quote requires a Permit2 signature
       * before the swap calldata can be built. 2-step on-device flow:
       * sign_permit → swap.
       */
      kind: "permit-then-swap";
      permitTypedData: EIP712Message;
      provider: DexProvider;
      buildContext: DexBuildContext;
    }
  | {
      /**
       * 3-step flow: approve_token → sign_permit → swap. Mirrors the
       * live-app `_stepMachine`'s `approve_token + sign_permit + swap`
       * sequence for classic AMM quotes that ship Permit2 typed data.
       */
      kind: "approval-then-permit-then-swap";
      approvalTransaction: QuoteApprovalTransaction;
      permitTypedData: EIP712Message;
      provider: DexProvider;
      buildContext: DexBuildContext;
    }
  | {
      /**
       * RFQ flow without an approval step: sign an off-chain EIP-712
       * order then submit it to the partner's `/{provider}/submit`
       * endpoint and poll `/swap/status` until the partner fills or
       * refunds the order. Mirrors the swap-live-app `handleRfqOrder`
       * action for UniswapX and 1inch Fusion.
       */
      kind: "rfq-order";
      rfqProvider: RfqProvider;
      /** Live-app provider id forwarded to the swap-api submit endpoint. */
      provider: string;
      orderTypedData: EIP712Message;
      submitBody: Record<string, unknown>;
      /** Order id when known up-front (1inch Fusion ships it on the quote). */
      precomputedOrderId?: string;
      /** Network slug forwarded to `/swap/status` (`ethereum`, `polygon`, …). */
      network: string;
    }
  | {
      /**
       * RFQ flow gated by an approval step: approve_token →
       * sign_rfq_order → submit_rfq_order. Used when UniswapX (or
       * another RFQ provider) requires an ERC-20 allowance for the
       * Permit2 spender before the order can be filled.
       */
      kind: "approval-then-rfq-order";
      approvalTransaction: QuoteApprovalTransaction;
      rfqProvider: RfqProvider;
      provider: string;
      orderTypedData: EIP712Message;
      submitBody: Record<string, unknown>;
      precomputedOrderId?: string;
      network: string;
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
  /**
   * Hardware-wallet app id returned by the DEX builder
   * (`"Uniswap" | "1inch" | "Velora" | "Ethereum"` for OKX). Hosts use
   * it to pick the right embedded app when opening the device for the
   * swap leg; the subsequent broadcast phase reuses the same init input
   * so the device stays on the partner app.
   */
  hwAppId: string;
};

export type SignPermit2IntentInput = {
  account: Account;
  typedData: EIP712Message;
  currencyId: string;
  derivationPath: string;
};

export type SignRfqOrderIntentInput = {
  account: Account;
  typedData: EIP712Message;
  currencyId: string;
  derivationPath: string;
};

export type SubmitRfqOrderIntentInput = {
  account: Account;
  provider: string;
  /** Already-signed submit body, with the EIP-712 signature spliced in. */
  submitBody: Record<string, unknown>;
  precomputedOrderId?: string;
  network: string;
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
  /** Build a Permit2 EIP-712 signing intent runtime instance + matching device init payload. */
  createSignPermit2Intent: (input: SignPermit2IntentInput) => {
    intent: TIntent;
    initInput: TInitInput;
  };
  /** Build an RFQ-order EIP-712 signing intent runtime instance + matching device init payload. */
  createSignRfqOrderIntent: (input: SignRfqOrderIntentInput) => {
    intent: TIntent;
    initInput: TInitInput;
  };
  /**
   * Build the RFQ submit-and-poll intent runtime instance. No device
   * interaction is performed; the machine forwards the previous phase's
   * `initInput` so the executor absorbs the intent change as a
   * self-transition (the device stays connected so the executor doesn't
   * tear down between the signing and the submit/poll phases).
   */
  createSubmitRfqOrderIntent: (
    input: SubmitRfqOrderIntentInput & { initInput: TInitInput },
  ) => { intent: TIntent; initInput: TInitInput };
  /**
   * Build a broadcast intent runtime instance. The machine forwards the
   * `initInput` from the previous phase so the executor absorbs the
   * intent change as a self-transition (see device-intent README).
   */
  createBroadcastIntent: (
    input: BroadcastIntentInput & { initInput: TInitInput },
  ) => { intent: TIntent; initInput: TInitInput };
  /**
   * Async fetch of provider calldata (`buildProviderTransactionData`).
   * Returns the swap calldata blob plus the partner's hardware-wallet
   * app id so the host can open the right embedded app for the swap
   * leg ("Uniswap" / "1inch" / "Velora" / "Ethereum" for OKX).
   */
  buildSwapTransactionData: (input: {
    provider: DexProvider;
    context: DexBuildContext;
  }) => Promise<{ transactionData: DexTransactionData; hwAppId: string }>;
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
    | "sign-permit2"
    | "sign-swap"
    | "broadcast-swap"
    | "sign-rfq-order"
    | "submit-rfq-order";
};
