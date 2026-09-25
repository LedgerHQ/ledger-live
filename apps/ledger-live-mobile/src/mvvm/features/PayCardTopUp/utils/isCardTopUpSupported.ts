import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { CARD_TOP_UP_SUPPORTED_LEDGER_IDS } from "../constants";

export function isCardTopUpSupported(asset: Pick<CardAssetRow, "ledgerId">): boolean {
  return CARD_TOP_UP_SUPPORTED_LEDGER_IDS.has(asset.ledgerId);
}
