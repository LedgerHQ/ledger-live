import type { SetupStage } from "./toSetupStage";

export type SetupStepperProps = Readonly<{
  stage: SetupStage;
  /** The checks wait for the user to start them: the stage shows no progress. */
  checksIdle: boolean;
  /** The paused checks found the device is not genuine. */
  notGenuine: boolean;
  /** The user skipped the OS update: the finished check says the device is not up to date. */
  firmwareDeclined: boolean;
  productName: string;
}>;
