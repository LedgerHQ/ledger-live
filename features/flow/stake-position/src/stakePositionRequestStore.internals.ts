import { StakePositionBusy } from "./errors";
import type {
  ShownStakePositionRequest,
  StakePositionOrigin,
  StakePositionPhase,
  StakePositionRequestInput,
  StakePositionResult,
} from "./types";

export type StakePositionRequest = Readonly<{
  shown: ShownStakePositionRequest;
  phase: StakePositionPhase;
  owner: symbol;
  resolve: (result: StakePositionResult) => void;
}>;

// Module-level so the Wallet API handlers of any live app player drive the one mounted surface.
let currentRequest: StakePositionRequest | null = null;
let lastRequestId = 0;
const listeners = new Set<() => void>();

export const getStakePositionRequest = () => currentRequest;

export function setStakePositionRequest(request: StakePositionRequest | null) {
  currentRequest = request;
  listeners.forEach(listener => listener());
}

export function subscribeToStakePositionRequest(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Replaces an open request, which answers `null` so its call doesn't hang. */
export function requestStakePosition(
  input: StakePositionRequestInput & Readonly<{ origin: StakePositionOrigin }>,
  owner: symbol,
): Promise<StakePositionResult> {
  const displacedRequest = currentRequest;
  if (displacedRequest?.phase === "committed") {
    return Promise.reject(new StakePositionBusy("A stake position is being signed or broadcast"));
  }

  return new Promise(resolve => {
    lastRequestId += 1;
    const shown = { ...input, id: lastRequestId };
    setStakePositionRequest({ shown, phase: "open", owner, resolve });
    if (displacedRequest?.phase === "open") displacedRequest.resolve({ action: null });
  });
}
