import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";

/**
 * One session, as the store holds it.
 *
 * A `PayCardSession` from the token grant satisfies this too, so the login machine hands one over
 * unchanged. Its lifetime is not kept: nothing reads it, because a renewal starts from a 401.
 */
export type StoredCardSession = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

/** A renewal failure, reduced to what a caller may see. Never a response body. */
export type CardSessionRenewalError = Readonly<{
  status?: number | string;
  message: string;
}>;

export type CardRenewalDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

/**
 * Installed once, at the app's composition root, because a renewal dispatches a Card mutation and
 * the store does not exist while its own `extraArgument` is being built.
 *
 * `onCardSessionEnded` exists because this package cannot reach a flow package. The app projects the
 * end of a session onto its own state: it empties the Card cache and publishes signed-out.
 */
export type CardSessionRenewalConfig = Readonly<{
  dispatch: CardRenewalDispatch;
  onCardSessionEnded: () => void;
}>;
