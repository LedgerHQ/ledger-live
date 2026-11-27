import { StakePositionBusy } from "./errors";
import type {
  ShownStakePositionRequest,
  StakePositionOpenResult,
  StakePositionOrigin,
  StakePositionPhase,
  StakePositionRequestInput,
} from "./types";

export type StakePositionRequest = Readonly<{
  shown: ShownStakePositionRequest;
  phase: StakePositionPhase;
  owner: symbol;
  resolve: (result: StakePositionOpenResult) => void;
}>;

// Module-level so the Wallet API handlers of any live app player drive the one mounted surface.
let currentRequest: StakePositionRequest | null = null;
let lastRequestId = 0;
// Requests up to this id are no longer kept for the surface that animated them out.
let releasedRequestId = 0;
const listeners = new Set<() => void>();

/** The device shows the exit, or it is signed: a new request would unmount its executor. */
const BUSY_PHASES: ReadonlySet<StakePositionPhase> = new Set(["signing", "committed"]);

export const getStakePositionRequest = () => currentRequest;

export const getReleasedStakePositionRequestId = () => releasedRequestId;

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function setStakePositionRequest(request: StakePositionRequest | null) {
  currentRequest = request;
  notifyListeners();
}

export function subscribeToStakePositionRequest(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Releases a request that is no longer held, so the surfaces stop showing it as closed. */
export function releaseStakePositionRequest(id: number) {
  const isHeld = currentRequest?.shown.id === id;
  if (isHeld || id <= releasedRequestId || id > lastRequestId) return;
  releasedRequestId = id;
  notifyListeners();
}

/** Replaces an open request, which answers `null` so its call doesn't hang. */
export function requestStakePosition(
  input: StakePositionRequestInput & Readonly<{ origin: StakePositionOrigin }>,
  owner: symbol,
): Promise<StakePositionOpenResult> {
  const displacedRequest = currentRequest;
  if (displacedRequest && BUSY_PHASES.has(displacedRequest.phase)) {
    return Promise.reject(new StakePositionBusy("A stake position is being signed or broadcast"));
  }

  return new Promise(resolve => {
    lastRequestId += 1;
    const shown = { ...input, id: lastRequestId };
    setStakePositionRequest({ shown, phase: "open", owner, resolve });
    if (displacedRequest?.phase === "open") displacedRequest.resolve({ action: null });
  });
}
