import { track } from "./segment";

const SEND = "Send";

export type SendAssetClass = "native" | "token";

export async function trackSendStarted(p: {
  network: string;
  assetClass: SendAssetClass;
  dryRun: boolean;
  device?: string;
}): Promise<void> {
  await track("send_started", {
    page: SEND,
    network: p.network,
    assetClass: p.assetClass,
    dryRun: p.dryRun,
    device: p.device,
  });
}

export async function trackSendFailed(p: { errorCode: string; errorName: string }): Promise<void> {
  await track("send_failed", {
    page: SEND,
    errorCode: p.errorCode,
    errorName: p.errorName,
  });
}

export async function trackSendCompleted(p: {
  network: string;
  assetClass: SendAssetClass;
  amount: string;
  device?: string;
}): Promise<void> {
  await track("send_completed", {
    page: SEND,
    network: p.network,
    assetClass: p.assetClass,
    amount: p.amount,
    device: p.device,
  });
}

export async function trackSendRejected(p: { network: string; device?: string }): Promise<void> {
  await track("send_rejected", {
    page: SEND,
    network: p.network,
    device: p.device,
  });
}
