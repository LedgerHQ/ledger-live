import { createCardSession } from "./internals/createCardSession";
import { secureStore } from "./internals/secureStore";

/** Native: the Card session lives in the iOS keychain and the Android keystore. */
export const { cardSession, getCardSessionToken, refreshCardSession } =
  createCardSession(secureStore);
