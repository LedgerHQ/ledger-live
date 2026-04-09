import { initWalletCliLiveCommon } from "./live-common-setup";

/**
 * Ensure USER_ID is set so DMK firmware distribution salt is stable for this CLI.
 */
if (!process.env.USER_ID) {
  process.env.USER_ID = "wallet-cli";
}

initWalletCliLiveCommon();
