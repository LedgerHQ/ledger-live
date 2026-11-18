import { RECEIVE_URLS } from "../urls";
import type { ReceiveNoticeId } from "../types";

export type ReceiveNoticeKind = ReceiveNoticeId | "unverifiableAddress";

export type ReceiveNotice = Readonly<{
  id: ReceiveNoticeKind;
  tone: "info" | "warning";
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

/**
 * The banners under the actions: the family's notices, then whether the device cannot show the
 * address, which also disables Verify.
 */
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
