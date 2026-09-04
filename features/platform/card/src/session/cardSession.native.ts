import { createCardSession } from "./internals/createCardSession";
import { secureStore } from "./internals/secureStore.native";

/** Native: the Card session lives in the iOS keychain and the Android keystore. */
export const {
  cardSession,
  getCardSessionToken,
  readCardSession,
  isCardSessionCurrent,
  refreshCardSession,
  configureCardSessionRenewal,
} = createCardSession(secureStore);
