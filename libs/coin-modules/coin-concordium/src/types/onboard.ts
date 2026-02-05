import { ConcordiumAccount } from "./bridge";

export enum AccountOnboardStatus {
  INIT = "INIT",
  PREPARE = "PREPARE",
  SIGN = "SIGN",
  SUBMIT = "SUBMIT",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export type ConcordiumOnboardProgress = {
  status: AccountOnboardStatus;
};

export type ConcordiumOnboardResult = {
  account: ConcordiumAccount;
};

export enum ConcordiumPairingStatus {
  INIT = "INIT",
  PREPARE = "PREPARE",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export type ConcordiumPairingProgress = {
  sessionTopic?: string | null;
  status: ConcordiumPairingStatus;
  walletConnectUri?: string | null;
};
