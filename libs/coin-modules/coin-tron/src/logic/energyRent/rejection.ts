import { TronifyApiError } from "../../types/errors";
import { payAssetBaseUnits, tronifyPayAsset, type SponsoredFeeAsset } from "../constants";

export type RentOrderRejection =
  | { reason: "insufficientBalance" }
  | { reason: "priceAboveApproved"; offered: { asset: SponsoredFeeAsset; amount: bigint } };

export function classifyRentOrderError(error: unknown): RentOrderRejection | null {
  if (error instanceof Error && error.name === "EnergyRentInsufficientBalance") {
    return { reason: "insufficientBalance" };
  }
  if (!(error instanceof TronifyApiError) || error.rule !== "ceiling" || !error.payCoinAmt) {
    return null;
  }
  const amount = payAssetBaseUnits(error.payCoinAmt);
  if (!amount.isFinite() || !amount.isGreaterThan(0)) return null;
  return {
    reason: "priceAboveApproved",
    offered: { asset: tronifyPayAsset(), amount: BigInt(amount.toFixed()) },
  };
}
