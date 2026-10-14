import { getCardSessionToken } from "@features/platform-card";
import type { Dispatch } from "@reduxjs/toolkit";
import { selectCardAuthStatus, type PayCardAuthStateRoot } from "./selectors";
import { setSignedIn } from "./slice";

async function hasStoredCardSession(): Promise<boolean> {
  try {
    return Boolean(await getCardSessionToken());
  } catch {
    return false;
  }
}

export async function restoreCardAuthStatus(
  dispatch: Dispatch,
  getState: () => PayCardAuthStateRoot,
): Promise<void> {
  const hasSession = await hasStoredCardSession();
  if (hasSession && selectCardAuthStatus(getState()) === "unknown") {
    dispatch(setSignedIn(true));
  }
}
