import type { RefObject } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { AppManifest } from "../../types";
import type { TrackingAPI } from "../../tracking";
import type { UiHook } from "../types";
import type { SmartWebsocket } from "../../SmartWebsocket";
import type { DappNetwork } from "../../logic/dapp/types";

export type MessageId = number | string | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface JsonRpcRequestMessage<TParams = any> {
  jsonrpc: "2.0";
  // Optional in the request.
  id?: MessageId;
  method: string;
  params?: TParams;
}

export type SetCurrentAccount = (account: AccountLike) => void;
export type SetCurrentAccountHist = (id: string, account: AccountLike) => void;

/**
 * Volatile data the dApp message dispatcher needs. Assembled by the `useDappLogic`
 * hook on every render and passed to `onDappMessage`, which runs its guards and
 * narrows this into a {@link DappMessageContext} before dispatching.
 */
export interface DappMessageDeps {
  manifest: AppManifest;
  currentAccount: AccountLike | null;
  currentParentAccount: Account | undefined;
  currentNetwork: DappNetwork | undefined;
  postMessage: (message: string) => void;
  tracking: TrackingAPI;
  uiHook: UiHook;
  setCurrentAccount: SetCurrentAccount;
  setCurrentAccountHist: SetCurrentAccountHist;
  mevProtected?: boolean;
  referrer?: string;
  wsRef: RefObject<SmartWebsocket | undefined>;
}

/**
 * The dispatcher's deps once its guards have passed: network, account and parent
 * account are guaranteed present. `signerAccount` is the parent account for token
 * accounts and the account itself otherwise.
 */
export interface DappMessageContext {
  manifest: AppManifest;
  currentAccount: AccountLike;
  signerAccount: Account;
  currentNetwork: DappNetwork;
  postMessage: (message: string) => void;
  tracking: TrackingAPI;
  uiHook: UiHook;
  setCurrentAccount: SetCurrentAccount;
  setCurrentAccountHist: SetCurrentAccountHist;
  mevProtected?: boolean;
  referrer?: string;
  wsRef: RefObject<SmartWebsocket | undefined>;
}
