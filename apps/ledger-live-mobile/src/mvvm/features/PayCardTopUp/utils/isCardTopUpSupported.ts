import type { CardAssetRow } from "@features/flow-pay-card-assets";

/** An empty `ledgerId` means Ledger Wallet has no currency for that Baanx wallet. */
export function isCardTopUpSupported(asset: Pick<CardAssetRow, "ledgerId" | "address">): boolean {
  return asset.ledgerId !== "" && asset.address.trim() !== "";
}
