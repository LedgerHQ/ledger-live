import { generateMnemonic } from "bip39";
import Transport from "@ledgerhq/hw-transport";
import { TrustchainSDK, WithDevice } from "../../src/types";

export type ScenarioOptions = {
  /**
   * easily create a sdk for a given member name
   */
  sdkForName: (name: string) => TrustchainSDK;
  /**
   * pause the recorder (e2e) part for a given amount of time
   */
  pauseRecorder: (milliseconds: number) => Promise<void>;
  /**
   * switch to the another device seed
   */
  switchDeviceSeed: (newSeed?: string) => Promise<{ id: string; transport: Transport }>;
  /**
   * withDevice function to pass to HWDeviceProvider
   */
  withDevice: WithDevice;
};

export type RecorderConfig = {
  seed?: string;
  coinapps?: string;
  overridesAppPath?: string;
  goNextOnText?: string[];
  approveOnText?: string[];
  approveOnceOnText?: string[];
};

export const recorderConfigDefaults = {
  goNextOnText: [
    "Login request",
    "Identify with your",
    "request",
    "Ensure you trust the",
    "keep",
    "update request",
  ],
  approveOnText: ["Log in to", "Enable", "Confirm"],
};

export const genSeed = () => generateMnemonic(256);
