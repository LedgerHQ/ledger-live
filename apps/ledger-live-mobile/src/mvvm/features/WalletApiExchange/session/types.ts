import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import type { SwapUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import type {
  ExchangeStartParamsUiRequest,
  ExchangeUiHooks,
} from "@ledgerhq/live-common/wallet-api/Exchange/uiRequests";
import type { ShowExchangeErrorIntentInput } from "@ledgerhq/live-common/exchange/intents/index";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";

/** The live app the session belongs to, forwarded to analytics and used to pick its drawer. */
export type ExchangeSessionManifest = Readonly<{ id: string; name: string }>;

type StartHookParams = Parameters<ExchangeUiHooks["custom.exchange.start"]>[0];

/** What the start hook reports alongside the nonce, for analytics. */
export type ExchangeStartMeta = NonNullable<Parameters<StartHookParams["onSuccess"]>[2]>;

/** `custom.exchange.start`, as the wallet-api UI hook receives it. */
export type ExchangeSessionStartRequest = Readonly<{
  manifest: ExchangeSessionManifest;
  exchangeParams: ExchangeStartParamsUiRequest;
  /**
   * The caller goes straight on to the device confirmation (a swap run by `executeSwap`), so the
   * drawer stays open while it fetches the provider payload. Otherwise the live app has its own
   * steps between start and complete, and the drawer closes once the nonce is known.
   */
  continuesOnDevice: boolean;
  onSuccess: StartHookParams["onSuccess"];
  onCancel: StartHookParams["onCancel"];
}>;

/** `custom.exchange.swap` and `custom.exchange.complete`: confirm, sign and broadcast. */
export type ExchangeSessionCompleteRequest = Readonly<{
  manifest: ExchangeSessionManifest;
  exchangeParams: SwapUiRequest;
  onSuccess: (operation: Operation) => void;
  onCancel: (error: Error) => void;
}>;

/**
 * Where the device flow is. A new object is made on every transition: the drawer builds one
 * intent per phase object.
 *
 * - `start`: the Exchange app is giving out a nonce.
 * - `awaiting-complete`: nothing runs on the device; the session waits for the confirmation.
 * - `confirm`: the user checks the exchange on the device, then the coin app signs it.
 * - `broadcast`: the signed operation is sent to the network.
 * - `refused`: the user refused on the device; the drawer waits for them to close it, then
 *   answers the request with `error`.
 * - `error`: the exchange failed; the drawer tells the user and waits for them to close it. The
 *   request was answered when it failed, so nothing is pending.
 */
export type ExchangeSessionPhase =
  | Readonly<{ step: "start"; request: ExchangeSessionStartRequest }>
  | Readonly<{ step: "awaiting-complete" }>
  | Readonly<{ step: "confirm"; request: ExchangeSessionCompleteRequest }>
  | Readonly<{
      step: "broadcast";
      request: ExchangeSessionCompleteRequest;
      signedOperation: SignedOperation;
    }>
  | Readonly<{ step: "refused"; request: ExchangeSessionCompleteRequest; error: Error }>
  | Readonly<{ step: "error"; details: ShowExchangeErrorIntentInput }>;

/** The phases that run a job in the executor, as opposed to the ones that wait or do JS work. */
export type ExchangeSessionJobPhase = Extract<
  ExchangeSessionPhase,
  { step: "start" | "confirm" | "error" }
>;

export type ExchangeSession = Readonly<{
  /**
   * Identifies the executor this session drives. It is the same for every step of a session, and
   * changes whenever the drawer has to start over, so a close reported by a drawer that is gone
   * can be told apart from one for the session that is open now.
   */
  id: number;
  manifest: ExchangeSessionManifest;
  /** The `ExchangeType` of the request that opened the session: swap, sell or fund. */
  exchangeType: number;
  /**
   * Shared by every phase of the session. The executor compares it by reference, so it only
   * changes when the device has to be prepared again.
   */
  initializationInput: InitializationInput;
  phase: ExchangeSessionPhase;
  /**
   * The last phase that ran a job. The executor always needs an intent: while the session waits,
   * it keeps this one, and stays idle on what that intent last rendered.
   */
  jobPhase: ExchangeSessionJobPhase;
}>;
