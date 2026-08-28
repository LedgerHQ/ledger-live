import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";

/**
 * One session, as the store holds it.
 *
 * A `PayCardSession` from a token grant satisfies this too, so the login machine and the renewal
 * both hand one over unchanged. Its lifetime is not kept: nothing reads it, because a renewal starts
 * from a 401.
 */
export type StoredCardSession = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

export type CardRenewalDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

/**
 * Installed once, at the app's composition root, because a renewal dispatches through the store and
 * the store does not exist while its own `extraArgument` is being built.
 *
 * `onCardSessionEnded` exists because this package cannot reach a flow package. The app projects the
 * end of a session onto its own state: it publishes signed-out and empties the Card cache.
 */
export type CardSessionRenewalConfig = Readonly<{
  dispatch: CardRenewalDispatch;
  onCardSessionEnded: () => void;
}>;

/** Thrown by `cardSession.set` when a logout or a newer login replaced the session first. */
export class CardSessionNotStoredError extends Error {
  override name = "CardSessionNotStoredError";
  constructor() {
    super("The Card session was replaced before it could be stored");
  }
}
