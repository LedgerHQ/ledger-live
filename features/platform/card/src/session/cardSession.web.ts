import { createCardSession } from "./internals/createCardSession";
import { secureStore } from "./internals/secureStore.web";

/** Web and desktop: the Card session lives in renderer memory for the life of the process. */
export const {
  cardSession,
  getCardSessionToken,
  readCardSession,
  isCardSessionCurrent,
  refreshCardSession,
  configureCardSessionRenewal,
} = createCardSession(secureStore);
