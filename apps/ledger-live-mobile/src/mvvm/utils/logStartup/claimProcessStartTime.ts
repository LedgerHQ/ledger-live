import { getStartupTimeBase } from "../resolveStartupEvents";

// Claim it before anything can restart JS (RNRestart): a later JS run of this process must not get it
getStartupTimeBase();
