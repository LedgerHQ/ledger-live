import { flag } from "../../define";

/** Gates R1+R2 Braze opt-out identity cleanup atomically. Default off — do not enable in prod until wipeData is validated (PR-8). */
export const brazeOptOutIdentityCleanup = flag();
