import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getStakePositionRequest,
  requestStakePosition,
  setStakePositionRequest,
  subscribeToStakePositionRequest,
  type StakePositionRequest,
} from "./stakePositionRequestStore.internals";
import type {
  ShownStakePosition,
  StakePositionAction,
  StakePositionOrigin,
  StakePositionRequestInput,
  StakePositionResult,
  StakePositionUnavailableReason,
} from "./types";

function findRequest(id: number) {
  const request = getStakePositionRequest();
  return request?.shown.id === id ? request : null;
}

/** The user closed the surface. A committed request keeps going: only its result closes it. */
export function dismissStakePosition(id: number): void {
  const request = findRequest(id);
  if (request === null || request.phase === "committed") return;

  setStakePositionRequest(null);
  if (request.phase === "open") request.resolve({ action: null });
}

/** The transaction is signed or handed off: the surface can no longer be dismissed. */
export function commitStakePosition(id: number): void {
  const request = findRequest(id);
  if (request?.phase !== "open") return;

  setStakePositionRequest({ ...request, phase: "committed" });
}

/** A committed transaction failed in a way the user can retry, or dismiss again. */
export function reopenStakePosition(id: number): void {
  const request = findRequest(id);
  if (request?.phase !== "committed") return;

  setStakePositionRequest({ ...request, phase: "open" });
}

/** Answers the live app. The request stays shown until the user closes the result. */
export function settleStakePosition(id: number, action: StakePositionAction): void {
  const request = findRequest(id);
  if (request === null || request.phase === "settled") return;

  setStakePositionRequest({ ...request, phase: "settled" });
  request.resolve({ action });
}

/** The host cannot act on the position: the live app gets the reason and falls back. */
export function settleStakePositionUnavailable(
  id: number,
  reason: StakePositionUnavailableReason,
): void {
  const request = findRequest(id);
  if (request?.phase !== "open") return;

  setStakePositionRequest(null);
  request.resolve({ action: null, reason });
}

/** The flow failed or was left: closes the surface whatever its phase. */
export function abandonStakePosition(id: number): void {
  const request = findRequest(id);
  if (request === null) return;

  setStakePositionRequest(null);
  if (request.phase !== "settled") request.resolve({ action: null });
}

function dismissOpenRequestOf(owner: symbol) {
  const request = getStakePositionRequest();
  if (request?.owner === owner && request.phase === "open") dismissStakePosition(request.shown.id);
}

/**
 * The request function a live app player hands to its Wallet API handlers. Unmounting the player
 * dismisses the open request it made, but leaves a committed or settled one and another player's.
 */
export function useStakePositionRequester(
  origin: StakePositionOrigin,
): (input: StakePositionRequestInput) => Promise<StakePositionResult> {
  const [owner] = useState(() => Symbol("stake position requester"));

  useEffect(() => () => dismissOpenRequestOf(owner), [owner]);

  return useCallback(input => requestStakePosition({ ...input, origin }, owner), [origin, owner]);
}

function isForOrigin(
  request: StakePositionRequest | null,
  origin: StakePositionOrigin | undefined,
): request is StakePositionRequest {
  return request !== null && (origin === undefined || request.shown.origin === origin);
}

const NOTHING_SHOWN: ShownStakePosition = { request: null, phase: "closed" };

function createShownReader(origin: StakePositionOrigin | undefined) {
  let shown = NOTHING_SHOWN;

  return (): ShownStakePosition => {
    const request = getStakePositionRequest();
    const next: ShownStakePosition = isForOrigin(request, origin)
      ? { request: request.shown, phase: request.phase }
      : { request: shown.request, phase: "closed" };
    if (next.request !== shown.request || next.phase !== shown.phase) shown = next;
    return shown;
  };
}

/** The request a surface of `origin` renders (any origin when omitted), and its phase. */
export function useShownStakePosition(origin?: StakePositionOrigin): ShownStakePosition {
  const readShown = useMemo(() => createShownReader(origin), [origin]);

  return useSyncExternalStore(subscribeToStakePositionRequest, readShown, readShown);
}

/** Whether the store holds a request of `origin` (any origin when omitted), whatever its phase. */
export function useIsStakePositionShown(origin?: StakePositionOrigin): boolean {
  const readIsShown = useCallback(() => isForOrigin(getStakePositionRequest(), origin), [origin]);

  return useSyncExternalStore(subscribeToStakePositionRequest, readIsShown, readIsShown);
}
