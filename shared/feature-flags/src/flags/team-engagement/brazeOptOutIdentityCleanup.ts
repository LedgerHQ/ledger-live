import { flag } from "../../define";

/** When enabled, skips Braze/Segment identity for opted-out users. See LIVE-34717. Default off. */
export const brazeOptOutIdentityCleanup = flag();
