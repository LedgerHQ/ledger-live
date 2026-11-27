import { RECEIVE_URLS } from "../urls";
import type { ReceiveNoticeId } from "../types";

export type ReceiveNoticeKind = ReceiveNoticeId | "unverifiableAddress";

export type ReceiveNoticeTone = "info" | "warning";

export type ReceiveNotice = Readonly<{
  id: ReceiveNoticeKind;
  tone: ReceiveNoticeTone;
  learnMoreUrl?: string;
}>;

const NOTICES: Readonly<Record<ReceiveNoticeKind, Omit<ReceiveNotice, "id">>> = {
  utxo: { tone: "info" },
  taproot: { tone: "warning" },
  dashStaking: { tone: "warning" },
  tronInactiveAccount: { tone: "warning", learnMoreUrl: RECEIVE_URLS.tronInactiveAccount },
  tezosDelegation: { tone: "info" },
  zcashPrivateNotEnabled: { tone: "info" },
  unverifiableAddress: { tone: "info" },
};

export function toReceiveNotices({
  familyNotices,
  canVerifyOnDevice,
}: Readonly<{
  familyNotices: readonly ReceiveNoticeId[];
  canVerifyOnDevice: boolean;
}>): readonly ReceiveNotice[] {
  const ids: ReceiveNoticeKind[] = [...familyNotices];
  if (!canVerifyOnDevice) ids.push("unverifiableAddress");
  return ids.map(id => ({ id, ...NOTICES[id] }));
}
