import Transport from "@ledgerhq/hw-transport";
import { generateMnemonic } from "bip39";
import { TrustchainSDK } from "../../src/types";

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
  switchDeviceSeed: (newSeed?: string) => Promise<Transport>;
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
  goNextOnText: ["Login request", "Identify with your", "request?", "Ensure you trust the"],
  approveOnText: ["Log in to", "Enable"],
};

export const genSeed = () => generateMnemonic(256);
