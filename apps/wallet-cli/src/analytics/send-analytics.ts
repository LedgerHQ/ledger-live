import { track } from "./segment";

const SEND = "Send";

export type SendAssetClass = "native" | "token";

export function trackSendStarted(p: {
  network: string;
  assetClass: SendAssetClass;
  dryRun: boolean;
  device?: string;
}): void {
  track("send_started", {
    page: SEND,
    network: p.network,
    assetClass: p.assetClass,
    dryRun: p.dryRun,
    device: p.device,
  });
}

export function trackSendFailed(p: { errorCode: string; errorMessage: string }): void {
  track("send_failed", {
    page: SEND,
    errorCode: p.errorCode,
    errorMessage: p.errorMessage,
  });
}

export function trackSendCompleted(p: {
  network: string;
  assetClass: SendAssetClass;
  amount: string;
  device?: string;
}): void {
  track("send_completed", {
    page: SEND,
    network: p.network,
    assetClass: p.assetClass,
    amount: p.amount,
    device: p.device,
  });
}

export function trackSendRejected(p: { network: string; device?: string }): void {
  track("send_rejected", {
    page: SEND,
    network: p.network,
    device: p.device,
  });
}
