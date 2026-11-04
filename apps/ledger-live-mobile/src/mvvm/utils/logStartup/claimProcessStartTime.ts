import { claimStartupOrigin } from "../resolveStartupEvents";

// Claim the native value at bundle start, so a JS-only restart (RNRestart) gets null
claimStartupOrigin();
