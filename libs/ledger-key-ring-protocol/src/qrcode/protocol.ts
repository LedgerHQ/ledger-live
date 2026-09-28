import { QRCodeProtocolError } from "../errors";
import { Message } from "./types";

export type MessageName = Message["message"];

export type Role = "host" | "candidate";

export type Direction = "recv" | "send";

export type ProtocolState =
  | "init"
  | "initiated"
  | "challenged"
  | "pin-exchanged"
  | "authenticated"
  | "credential-shared"
  | "credential-requested"
  | "credential-returned"
  | "finished";

type Transition = { direction: Direction; on: MessageName; to: ProtocolState };

/**
 * Each state is named after the last message exchanged to reach it. The handshake being
 * symmetrical, the candidate runs this very table with every direction flipped: the ones
 * below are the directions expected of the host.
 */
const transitions: Record<ProtocolState, Transition[]> = {
  init: [{ direction: "recv", on: "InitiateHandshake", to: "initiated" }],
  initiated: [{ direction: "send", on: "HandshakeChallenge", to: "challenged" }],
  challenged: [{ direction: "recv", on: "CompleteHandshakeChallenge", to: "pin-exchanged" }],
  "pin-exchanged": [{ direction: "send", on: "HandshakeCompletionSucceeded", to: "authenticated" }],
  authenticated: [
    { direction: "recv", on: "TrustchainShareCredential", to: "credential-shared" },
    { direction: "recv", on: "TrustchainRequestCredential", to: "credential-requested" },
  ],
  "credential-requested": [
    { direction: "send", on: "TrustchainShareCredential", to: "credential-returned" },
  ],
  "credential-shared": [{ direction: "send", on: "TrustchainAddedMember", to: "finished" }],
  "credential-returned": [{ direction: "recv", on: "TrustchainAddedMember", to: "finished" }],
  finished: [],
};

const flip = (direction: Direction): Direction => (direction === "recv" ? "send" : "recv");

/** a Failure is neither encrypted nor authenticated: only take it where a side can emit one */
const FAILURE_STATES: ReadonlySet<ProtocolState> = new Set([
  "pin-exchanged",
  "authenticated",
  "credential-shared",
  "credential-requested",
  "credential-returned",
]);

export type ProtocolStateMachine = {
  getState: () => ProtocolState;
  transition: (direction: Direction, message: MessageName) => void;
  bindPeer: (publisher: string) => void;
  /** ends the session for good: nothing is accepted or sent afterwards */
  abort: () => void;
  isFinished: () => boolean;
};

export function createProtocolStateMachine(role: Role): ProtocolStateMachine {
  let state: ProtocolState = "init";
  let peer: string | undefined;

  const expected = (direction: Direction): Direction =>
    role === "host" ? direction : flip(direction);

  return {
    getState: () => state,

    transition: (direction, message) => {
      if (direction === "recv" && message === "Failure") {
        if (!FAILURE_STATES.has(state)) {
          throw new QRCodeProtocolError(`unexpected Failure in state ${state}`);
        }
        state = "finished";
        return;
      }
      const transition = transitions[state].find(
        t => t.on === message && expected(t.direction) === direction,
      );
      if (!transition) {
        throw new QRCodeProtocolError(`unexpected ${direction} of ${message} in state ${state}`);
      }
      state = transition.to;
    },

    bindPeer: value => {
      const publisher = value.toLowerCase();
      if (peer === undefined) {
        peer = publisher;
        return;
      }
      if (peer !== publisher) {
        throw new QRCodeProtocolError("message publisher does not match the bound peer");
      }
    },

    abort: () => {
      state = "finished";
    },

    isFinished: () => state === "finished",
  };
}
