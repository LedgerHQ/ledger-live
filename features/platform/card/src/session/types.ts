import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";

export type StoredCardSession = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

export type CardRenewalDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export type CardSessionRenewalConfig = Readonly<{
  dispatch: CardRenewalDispatch;
  onCardSessionEnded: () => void;
}>;

export class CardSessionNotStoredError extends Error {
  override name = "CardSessionNotStoredError";
  constructor() {
    super("The Card session was replaced before it could be stored");
  }
}
