import React from "react";
import { useTranslation } from "react-i18next";
import { useFeature } from "@features/platform-feature-flags";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, ZcashTransferType } from "@ledgerhq/coin-zcash/types";

const ZCASH_SEND_TITLE_KEY: Record<ZcashTransferType, string> = {
  transparent: "zcash.shielded.send.modalTitle.transparent",
  "transparent-to-shielded": "zcash.shielded.send.modalTitle.transparentToShielded",
  "shielded-to-transparent": "zcash.shielded.send.modalTitle.shieldedToTransparent",
  shielded: "zcash.shielded.send.modalTitle.shielded",
};

/** Names the pool a send moves funds between, once shielded Zcash is on. */
const SendModalTitle = ({
  transaction,
  fallback,
}: {
  account: Account;
  transaction: Transaction | undefined | null;
  fallback: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;

  const transferType = shieldedEnabled ? transaction?.transferType : undefined;

  if (!transferType) return <>{fallback}</>;

  return <>{t(ZCASH_SEND_TITLE_KEY[transferType])}</>;
};

export default SendModalTitle;
