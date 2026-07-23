import { useTranslation } from "react-i18next";
import { useFeature } from "@features/platform-feature-flags";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import type {
  ZcashTransaction,
  ZcashTransferType,
} from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/types";

const ZCASH_SEND_TITLE_KEY: Record<ZcashTransferType, string> = {
  transparent: "zcash.shielded.send.modalTitle.transparent",
  "transparent-to-shielded": "zcash.shielded.send.modalTitle.transparentToShielded",
  "shielded-to-transparent": "zcash.shielded.send.modalTitle.shieldedToTransparent",
  shielded: "zcash.shielded.send.modalTitle.shielded",
};

const useSendModalTitle = ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction | undefined | null;
}): string | null => {
  const { t } = useTranslation();
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;

  if (!shieldedEnabled) return null;
  if (account.currency.id !== "zcash") return null;

  const transferType = (transaction as ZcashTransaction | undefined)?.transferType;
  if (!transferType) return null;

  return t(ZCASH_SEND_TITLE_KEY[transferType]);
};

export default useSendModalTitle;
