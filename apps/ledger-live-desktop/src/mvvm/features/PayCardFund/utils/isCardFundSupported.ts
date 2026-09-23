import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { CARD_FUND_SUPPORTED_LEDGER_IDS } from "../constants";

export function isCardFundSupported(asset: Pick<CardAssetRow, "ledgerId">): boolean {
  return CARD_FUND_SUPPORTED_LEDGER_IDS.has(asset.ledgerId);
}
