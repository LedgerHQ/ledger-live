import {
  servesPurpose,
  type AccountDataSource,
  type AccountTarget,
} from "@domain/api-account-data";
import type { AccountDataSourceId } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type {
  BroadcastedTransaction,
  PreparedTransaction,
  SendRequest,
  SignedTransaction,
} from "@domain/entity-account-transaction";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { Observable } from "rxjs";

/** The session the Device Intent Executor opened, the account's app running; `compatDeviceId` serves the legacy `withDevice` path. */
export type SigningDevice = {
  readonly dmk: DeviceManagementKit;
  readonly sessionId: string;
  readonly compatDeviceId: string;
};

/** What the device does while signing; a refusal on the device is a `SignatureRefusedError`. */
export type TransactionSignEvent =
  | { type: "device-streaming"; progress: number }
  | { type: "device-signature-requested" }
  | { type: "device-signature-granted" }
  | { type: "signed"; signed: SignedTransaction };

/** How a source sends from the accounts it supports; sign and broadcast only take what this source prepared. */
export type AccountSendCapability = {
  /** Pure and synchronous, from the descriptor alone. */
  supports(descriptor: AccountDescriptor): boolean;
  /** Rejects with `AccountDataNotServedError` to hand the account to the next ranked source. */
  prepare(target: AccountTarget, request: SendRequest): Promise<PreparedTransaction>;
  sign(
    target: AccountTarget,
    prepared: PreparedTransaction,
    device: SigningDevice,
  ): Observable<TransactionSignEvent>;
  broadcast(
    target: AccountTarget,
    prepared: PreparedTransaction,
    signed: SignedTransaction,
  ): Promise<BroadcastedTransaction>;
};

/** A source of the account data router that also sends: one id, rank and purpose list for both. */
export type AccountSendingSource = AccountDataSource & { readonly send: AccountSendCapability };

export const isSendingSource = (source: AccountDataSource): source is AccountSendingSource =>
  "send" in source && source.send !== undefined;

/** A prepared transaction with the account and the source it belongs to: what sign and broadcast take. */
export type PreparedSend = {
  readonly target: AccountTarget;
  readonly sourceId: AccountDataSourceId;
  readonly prepared: PreparedTransaction;
};

export const sendsFrom = (source: AccountSendingSource, descriptor: AccountDescriptor): boolean =>
  servesPurpose(source, descriptor) && source.send.supports(descriptor);
