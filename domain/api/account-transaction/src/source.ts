import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import type { AccountDataSourceId } from "@domain/entity-account-data";
import type { AccountDescriptor, AccountUUID } from "@domain/entity-account-descriptor";
import type {
  BroadcastedTransaction,
  FeeEstimate,
  FeeStrategy,
  PreparedTransaction,
  SendRequest,
  SignedTransaction,
} from "@domain/entity-account-transaction";
import type { DeviceManagementKit, DeviceModelId } from "@ledgerhq/device-management-kit";
import type { Observable } from "rxjs";

/** The session the Device Intent Executor opened, the account's app running; `compatDeviceId` serves the legacy `withDevice` path. */
export type SigningDevice = {
  readonly dmk: DeviceManagementKit;
  readonly sessionId: string;
  readonly compatDeviceId: string;
  /** Some legacy signers pick their path by model, Zcash on a Nano S for instance. */
  readonly deviceModelId: DeviceModelId;
};

type DeviceSignEvent =
  | { type: "device-streaming"; progress: number }
  | { type: "device-signature-requested" }
  | { type: "device-signature-granted" };

/** What the device does while signing; a refusal on the device is a `SignatureRefusedError`. */
export type TransactionSignEvent = DeviceSignEvent | { type: "signed"; signed: SignedTransaction };

/** How a source sends from the accounts it supports; sign and broadcast only take what this source prepared. */
export type AccountSendCapability = {
  /** Pure and synchronous, from the descriptor alone. */
  supports(descriptor: AccountDescriptor): boolean;
  /** Rejects with `AccountDataNotServedError` to hand the account to the next ranked source. */
  prepare(target: AccountTarget, request: SendRequest): Promise<PreparedTransaction>;
  /** The fees of each strategy for the same request, without keeping any preparation. */
  estimateFees?(
    target: AccountTarget,
    request: SendRequest,
    strategies: readonly FeeStrategy[],
  ): Promise<FeeEstimate[]>;
  sign(
    target: AccountTarget,
    prepared: PreparedTransaction,
    device: SigningDevice,
  ): Observable<TransactionSignEvent>;
  /** Rejects a signature of another preparation than `prepared`. */
  broadcast(
    target: AccountTarget,
    prepared: PreparedTransaction,
    signed: SignedTransaction,
  ): Promise<BroadcastedTransaction>;
  /** Frees what the source holds for a preparation the flow gave up on; a no-op once broadcast. */
  release?(target: AccountTarget, prepared: PreparedTransaction): void;
};

/** A source of the account data router that also sends: one id, rank and purpose list for both. */
export type AccountSendingSource = AccountDataSource & { readonly send: AccountSendCapability };

export const isSendingSource = (source: AccountDataSource): source is AccountSendingSource =>
  "send" in source && source.send !== undefined;

/** A prepared transaction with the account and the source it belongs to: what sign and broadcast take. */
export type PreparedSend = {
  /** Unique per preparation: a signature only broadcasts with the preparation it signed. */
  readonly id: string;
  readonly target: AccountTarget;
  readonly sourceId: AccountDataSourceId;
  readonly prepared: PreparedTransaction;
};

/** A signature, bound to the account, source and preparation it was made for. */
export type SignedSend = {
  readonly preparationId: string;
  readonly accountUUID: AccountUUID;
  readonly sourceId: AccountDataSourceId;
  readonly signed: SignedTransaction;
};

export type SendSignEvent = DeviceSignEvent | { type: "signed"; signed: SignedSend };
